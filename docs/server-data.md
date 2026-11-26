# Server data: dependencies and invalidation

Reference for the RTK Query cache: what each resource holds, which
mutations make it stale and how the cache follows the session and the
selected space. The rules are checked by
`src/redux/api/invalidation.test.ts`; `src/redux/api/scenarios.test.tsx`
covers the user-visible scenarios end to end.

Transactions and statistics are read and written through `/api/v2`
(`apiVersion: 2` on the request; the backend's
`docs/transactions-v2-contract.md`): a record belongs to its space and
carries an `author` and an `assignment` (a member, the whole space or
nobody), and a breakdown groups by assignment. Every other resource stays
on `/api/v1`. There are no wallets: no wallet request, tag or cache entry
exists.

Invalidation happens only after a successful mutation (an empty body
counts as success), so a failed or session-stale write refreshes nothing.
The exceptions are refusals that prove the cache is behind the server:

- A limit create or edit rejected with `400 CATEGORY_ARCHIVED` refreshes
  Limits and Categories.
- A transaction write refused with `TRANSACTION_NOT_FOUND`,
  `TRANSACTION_VERSION_CONFLICT`, `CATEGORY_ARCHIVED` or
  `FORBIDDEN_CATEGORY` refreshes everything a transaction write does; one
  refused with `ASSIGNEE_NOT_MEMBER` refreshes Members too, as the member
  it named has left.
- An invitation resend refreshes Members after any answer except one that
  outlived its session: a refused or unanswered resend may still have
  scheduled an email, a `429` moves the cooldown and a `404` means the
  invitation ended.
- A space creation left unanswered past its key's lifetime refreshes
  Spaces without being sent again, so the user sees whether it was
  created; creating it anyway starts a new attempt under a new key, as the
  old one may no longer be known to the server.
- An invitation accept refused with `409 SPACE_ALREADY_MEMBER` counts as
  joined: it refreshes Spaces and selects the space the answer names.
- A transaction request refused with `403 FORBIDDEN_SPACE` removes every
  cached entry of that space and refreshes Spaces, whose fallback moves
  the selection to a space the user still belongs to. Any other read
  refused with `403` for the current space refreshes Spaces too; once the
  list no longer has the space, the selection moves off it and its cached
  entries are removed.

No transaction list is loaded whole: Home reads one `History.Recent`
entry per month (the current month's is also asked for early by the
session data), the Transactions tab reads `History.Feed` page
by page, and every total (`summary`, a day's `net`, the picker's count)
comes from the server. The tab asks for `History.Latest` only while its
period is empty; Home never needs it.

## Cached resources

Every resource except Spaces, Profile, Currencies and `InvitePreview` is
scoped to a space: its argument carries `spaceId`, and so do its cache
entry and tags.

| Key              | Endpoint                                                      | Contents that other mutations can change                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Spaces`         | `GET /spaces`                                                 | Caller's `role`, `member_count`, space list itself                                                                                                                                                       |
| `Profile`        | `GET /users/profile`                                          | — (no mutation endpoint)                                                                                                                                                                                 |
| `Currencies`     | `GET /currencies`                                             | — (reference data)                                                                                                                                                                                       |
| `Categories`     | `GET /spaces/:id/categories`                                  | `transaction_count` (all transactions of the space), `limit: {id, name}` membership, `is_active`/`archived_at`, `sort`                                                                                   |
| `Limits`         | `GET /spaces/:id/limits?time_zone=`                           | `spent`/`in_percent` per limit over the current month's dates returned as `period` (every expense of the space, whatever its assignment), embedded category `name`/`icon`/`color`, `over_allocation`     |
| `History.Recent` | `GET /spaces/:id/transactions/feed?from_date&to_date&limit=3` | Home's latest three records of the month it shows; the current month's entry is shared with the session data                                                                                             |
| `History.Latest` | `GET /spaces/:id/transactions/latest`                         | Single most recent row (or `null`); tells "no transactions at all" apart from "none in this period"                                                                                                      |
| `History.Count`  | `GET /spaces/:id/transactions/count?from_date&to_date[&q]`    | `summary.count` of the same `History.Feed` selection, initial balances included; the period picker's counter                                                                                             |
| `History.Feed`   | `GET /spaces/:id/transactions/feed?from_date&to_date[&q]`     | Cursor pages of rows (same row shape) with the selection's `summary` and each listed day's `net`; one entry per selection and load generation; the Transactions tab, its search and the Stats drill-down |
| `Transaction`    | `GET /spaces/:id/transactions/:transactionId`                 | One record as its details show it, with its `version`, `author` and `assignment`                                                                                                                         |
| `Operation`      | `GET /spaces/:id/transactions/operations/:operationId`        | Whether a create applied (and its record, or `null` if deleted since); provides no tags, always read afresh and dropped at once (`docs/transactions.md`)                                                 |
| `Assignees`      | `GET /spaces/:id/transactions/assignees`                      | History's "Assigned to" filter: current members, former members with records, whether a deleted account has records; provides `Transactions` and `Members`                                               |
| `Members`        | `GET /spaces/:id/members`                                     | Member rows and pending invite rows with their email delivery state                                                                                                                                      |
| `InvitePreview`  | `POST /spaces/invites/preview`                                | Not scoped to a space and provides no tags; one entry per link token, read again after a restart rather than stored                                                                                      |
| `Statistics`     | `GET /spaces/:id/statistics/{summary,trend,breakdown}`        | Every transaction sum and count; category names, colors and archived state; people's names and membership                                                                                                |

"History" below means all of `History.Recent`, `History.Latest`,
`History.Count`, `History.Feed`, `Transaction` and `Assignees`: every
entry that provides the space's `Transactions` tag.

`History.Feed` is an infinite query (`getTransactionsFeed`), read through
`useTransactionsFeed`. Its pages provide no tags, so an invalidation never
asks for them again one by one. `getTransactionsRevision`, a local query
with no request, provides the space's `Transactions` tag instead; each new
value starts a new generation (a separate entry) with one page around the
topmost row on screen that is still listed, or the newest page while the
newest page is on screen. If that row was deleted or left the selection
since (`404`), up to three of its nearest neighbours are tried in turn,
then the newest page. The rows on screen stay until the new page arrives
and are then replaced as a whole; `maintainVisibleContentPosition` keeps
the anchor row where it was. Invalidation is `delayed` (RTK Query's
default), so a page already loading finishes first and is replaced with
the rest of the window.

A pull-to-refresh, a rejected cursor, a new selection or an `around_id`
outside the selection also starts a new generation. A cursor the server
refuses (one issued before calendar dates, say) reloads the first page
once for the selection; a second refusal stays a page error with Retry,
so a server that keeps refusing never loops. The replaced entry
is removed at once (`keepUnusedDataFor: 0`), which aborts a page it still
loads, so nothing from it can land on screen.

An entry keeps at most `FEED_MAX_PAGES` (10) pages: loading past them
drops the page at the far end, which is read again by its cursor when
the list scrolls back; `summary` and the nets of the days still listed
come from the pages that remain.

A deleted row leaves the cached `History.Recent` and `History.Feed`
pages at once (`dropFromLists`); the new generation that follows brings
the server's totals. Opening a record from a confirmation scrolls to it
when it is already listed in its month; otherwise the month opens with
`around_id`, and a record gone or outside its month opens the month's
newest page with a message saying so. Opening and closing a record's
details changes nothing in the list.

## Invalidation rules

What each successful mutation invalidates, which is what the server
changes. Space-scoped endpoints are written without their `/spaces/:id`
prefix, and their tags carry that space's id.

| Successful mutation                        | Endpoint                                                                         | Invalidates                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Create transaction                         | `POST /transactions` (v2)                                                        | History; Statistics; Limits (spent); Categories (`transaction_count`)                                     |
| Edit or reassign transaction               | `PATCH /transactions/:id` (v2, `If-Match`)                                       | Same as create; the record leaves its old assignment's lists and joins the new one's                      |
| Delete transaction (also Undo of a create) | `DELETE /transactions/:id` (v2, `If-Match`)                                      | Same as create                                                                                            |
| Create category                            | `POST /categories`                                                               | Categories                                                                                                |
| Edit category (name/icon/color)            | `PUT /categories/:id`                                                            | Categories; Limits (embedded category); History and Statistics (embedded category)                        |
| Archive category                           | `PUT /categories/:id` with `is_active: 0`                                        | Categories; Limits (category unlinked, limit deleted if it was its last category); History and Statistics |
| Restore category                           | `PUT /categories/:id` with `is_active: 1`                                        | Categories; Limits; History and Statistics. Limit membership is not restored.                             |
| Delete category → archived                 | `DELETE /categories/:id`, `{archived: true}`                                     | Same as archive                                                                                           |
| Delete category → removed                  | `DELETE /categories/:id`, `{archived: false}` (only when it has no transactions) | Categories; Limits (category unlinked, limit deleted if it was its last category)                         |
| Reorder categories                         | `PUT /categories/reorder`                                                        | Categories                                                                                                |
| Create / edit / delete limit               | `POST`, `PUT`, `DELETE /limits[/:id]`                                            | Limits; Categories (`limit: {id, name}` of every category added, removed or renamed)                      |
| Invite member                              | `POST /spaces/:id/invites`                                                       | Members                                                                                                   |
| Resend invite                              | `POST /spaces/:id/invites/:inviteId/resend`                                      | Members (`email_status`, `can_resend`, `resend_after_seconds`), also after a refusal or no answer         |
| Revoke invite                              | `DELETE /spaces/:id/invites/:inviteId`                                           | Members                                                                                                   |
| Remove another member (owner)              | `DELETE /spaces/:id/members/:userId`                                             | Members (also `Assignees` and Statistics, which name people by membership); Spaces (`member_count`)       |
| Leave space                                | `DELETE /spaces/:id/members/:self`                                               | Spaces; the selection then moves to another space (see "Space selection")                                 |
| Accept invite                              | `POST /spaces/invites/accept`                                                    | Spaces; the joined space is selected                                                                      |
| Create space                               | `POST /spaces` (`Idempotency-Key`)                                               | Spaces; the new space is selected                                                                         |

Statistics follows through `getStatisticsRevision` (see "Statistics"),
which provides the space's `Transactions`, `Categories` and `Members`
tags. Selecting a space makes nothing stale: each space has its own
entries, and sign-in and sign-out start from an empty cache. Both are
described in "Lifecycle".

### Staleness with no local mutation

- **Other members of a shared space.** Home, Transactions, Limits and
  Categories call `useSpaceRefresh`: a return to the screen, or to the app
  while it shows one of them, invalidates the space's `Transactions`,
  `Limits`, `Categories` and `Members` (`refreshSpaceData`; members, so a
  newly joined one can be assigned), at most once every 30 s per space. Stats follows through its revision and also
  restarts its own cycle when it is older than 30 s. Open details are read
  again on a return to the app; a form being edited keeps its draft.
- **Invitation emails.** Members asks for the roster again every 5 s
  while an invitation's email is `queued` or `sending` and the screen is
  in focus, for at most 2 minutes after the screen comes into focus or the
  owner invites or resends (`useDeliveryPolling`). A `sent`, `failed` or
  `not_sent` email, leaving the screen or the end of that window stops it.
- **Month rollover.** `useSpaceRefresh` also wakes when a new month begins:
  it renders the screen again, so a current period moves onto the new
  month, and refreshes the space's data regardless of the 30 s limit.

## Transaction reads and writes

- A transaction happens on a calendar `date` (`YYYY-MM-DD`), with no time
  of day: it is shown as stored and never read through a zone
  (`src/shared/utils/calendarDate.ts`). History, Home's activity and the
  count select by `from_date`/`to_date`, both included, the days the
  period picker shows; Stats passes its `start_date` and
  `actual_end_date` through unchanged, so a row and the list behind it
  hold the same records in every zone. A write sends `date` with the
  device's `time_zone`, which only tells the server which day is today;
  a resend keeps the zone it was first sent with. Within a day the
  server's order is kept as it came.
- Every transaction read and write result is the backend's v2
  transaction view: `kind`, `version`, `author` (with `source`),
  `assignment` (people resolved to `member`, `former_member` or
  `deleted`) and a compact `category` without `transaction_count`,
  `limit` or `sort`, mapped to `TransactionCategoryModel` rather than the
  Categories API's `CategoryModel`.
- A write carries an `Idempotency-Key`; an edit or a delete also sends
  the version it was based on as `If-Match`, so a change made elsewhere
  meanwhile is refused with `TRANSACTION_VERSION_CONFLICT` instead of
  overwritten. A create also carries the key as `client_operation_id`,
  which `Operation` looks up. How outcomes are handled and kept across
  restarts: `docs/transactions.md`.
- A write changes history under its old and its new assignment, so it
  invalidates the space's tags, not entries of one selection: every list,
  filter and statistics cycle of the space reads again.
- A transaction created outside the currently cached period does not
  change `History.Recent`/`History.Feed` rows, but invalidating them
  anyway is correct and cheap; no need to match on dates.
- An income transaction does not change Limits; a per-type rule is
  possible but not required.

## Statistics

The three Stats blocks are one load cycle (`src/screens/Stats/hooks/useStatsData.ts`):
the same space, period, zone and `as_of`, per the backend's
`docs/statistics-contract.md`. Because `as_of` is part of every argument, the
blocks provide no tags; a refetch of the same arguments would miss anything
recorded after that `as_of`. Instead `getStatisticsRevision`, a local query with
no request, provides the space's `Transactions`, `Categories` and `Members`
tags (a breakdown names people by their current names and membership), and
each new value starts a new cycle. So does a return to the screen or
to the app on it, when the cycle is older than 30 seconds.

A new cycle for the same space and period keeps each block's last successful
result on screen, flagged as updating or, if its request failed, as not
updated. A new space, period or zone drops them in the same render.

## Lifecycle

### Loading

- **Launch and sign-in.** The `launch` slice loads the profile and the
  spaces list and restores the saved space before the app opens; a failed
  required request is a retryable failure on the Launch screen. See
  `docs/launch.md`. No space-scoped data is required to open the app.
- **Session data.** `useSessionData` (`src/navigation/`) keeps the
  profile and spaces subscribed and, once the app is open, asks early for
  the selected space's Categories, Limits and current-month
  `History.Recent`. Everything else is read by the screen that shows it.
- **What a refresh looks like.** Views read `currentData` and take their
  state from `getLoadState`: a spinner or skeleton only while their
  argument has no result yet; a background refetch, failed or not, keeps
  the last result on screen, and `hasRefreshError` lets the screen say it
  could not be brought up to date.
- **Returns and a new month.** See "Staleness with no local mutation"
  above; there is no refetch on reconnect or on an interval. History has
  pull-to-refresh.

### Errors and retry

- **No automatic retries** of reads. A retry is a user action: a Retry
  where the screen has no data, or a banner with Retry where a refresh of
  shown data failed (Home, Transactions and Stats; Stats also shows an
  error toast once per failed attempt, `docs/toasts.md`). Pending
  transaction writes are the exception: they are sent again on their own
  (`docs/transactions.md`).
- **Network failures** are turned into a truthy `ErrorResponse`
  (`statusCode: 0`) by `getRejectValue`, so they never look like an empty
  successful result. A response keeps its HTTP status and `Retry-After`
  whatever its body; only the API's own JSON error passes its fields on,
  and anything else (an empty body, a proxy's HTML page, other JSON) gets
  a message of the app's own.
- **401** from the axios instance ends the session, but only if the
  request carried the token of the session still current.
- **429** shows the generic rate-limit toast only for a request nothing
  on screen explains: mutations and requests passing `isHandledRateLimit`
  report it where they were made. `inviteMember` also starts a cooldown
  from `Retry-After` that outlives space switches.

### Space selection

- `activateSpace(id)` is the only way to change the selected space;
  selecting the current one is a no-op. Triggers: `SpaceSwitcher`, the
  launch, the spaces-list fallback, creating a space, accepting an
  invitation and leaving a space (all through `space/thunks.ts`, which
  check the session is still current). The id is saved per account.
- When the spaces list arrives without the selected space, the selection
  moves to the personal space, otherwise the lowest id, and the old
  space's cached entries are removed (`dropSpaceData`).
- A switch resets nothing in the cache: every space-scoped entry is keyed
  by its `spaceId`, and views reading `currentData` never show another
  space's result. An open transaction ends (`transactionFlow`), and a
  confirmation asked in the old space is dropped (`docs/sheets.md`).
- A transaction write captures its session and space; an answer that
  arrives after either changed surfaces nothing in the current one, while
  the write itself stays pending until its outcome is known.

### Sign-out

- Triggered from Settings or by a 401. `logoutMe` deletes the token (a
  storage failure still logs out); on fulfilled every slice resets and
  `resetApiState` empties the cache and aborts running requests.
  `auth.sessionKey` is incremented, and `httpBaseQuery` turns any answer
  to a request of an ended session into a stale error (`isStale`), so it
  reaches neither the cache nor a side effect.
- Pending transaction writes and an unanswered space creation stay in
  storage for the same user's next session.
- `RootNavigator` swaps to the auth stack, unmounting every signed-in
  screen. There is no server-side logout call; the token is only
  forgotten locally.
