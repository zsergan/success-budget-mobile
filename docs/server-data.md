# Server data: dependencies and invalidation

Reference for moving server data onto RTK Query. It records which cached
data each successful mutation makes stale, based on the backend services
(`success-budget-backend`, `main` at `fd0d717`) and on the Redux thunks in
`src/redux/state/*/thunks.ts` at `f9cc9c1`.

All server data, including spaces, members, the profile and currencies,
now follows the "Stale" column through RTK Query tags (`src/redux/state/<domain>/api.ts`, checked by
`src/redux/api/invalidation.test.ts`); the "Refreshed today" and "Gap"
columns and the lifecycle section record the thunk-era behavior.
Invalidation happens only after a successful mutation (an empty body
counts as success), so a failed or session-stale write refreshes nothing.
One exception: a limit create or edit rejected with
`400 CATEGORY_ARCHIVED` refreshes Limits and Categories,
because the error itself shows a category was archived elsewhere.
Likewise a transaction write refused with `TRANSACTION_NOT_FOUND`,
`TRANSACTION_VERSION_CONFLICT`, `WALLET_DELETED`, `CATEGORY_ARCHIVED`,
`FORBIDDEN_WALLET` or `FORBIDDEN_CATEGORY` refreshes everything a
transaction write does, since the cached record, wallet or category is
behind the server.
A transaction request refused with `403 FORBIDDEN_SPACE` removes every
cached entry of that space and refreshes Spaces, whose fallback moves the
selection to a space the user still belongs to.
Any read refused with `403` for the current space refreshes Spaces too;
once the list no longer has the space, the selection moves off it and its
cached entries are removed.
No transaction list is loaded whole any more: Home and the initial-load
gate share one `History.Recent` entry of five records, the Transactions
tab reads `History.Feed` page by page, and every total (`summary`, a
day's `net`, the picker's count) comes from the server. The tab asks for
`History.Latest` only while its period is empty; Home, which lists the
whole history, never needs it. `GET /transactions` (the whole period as
one array, once `History.Range`) is no longer requested.
`src/redux/api/scenarios.test.tsx` covers the user-visible scenarios
end to end.

## Cached resources

Every resource except Profile and Currencies is scoped to the active space.

| Key              | Endpoint                                                        | Client state today    | Contents that other mutations can change                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Spaces`         | `GET /spaces`                                                   | `space.spaces`        | Caller's `role`, `member_count`, space list itself                                                                                                                                                       |
| `Profile`        | `GET /users/profile`                                            | `profile`             | — (no mutation endpoint)                                                                                                                                                                                 |
| `Currencies`     | `GET /currencies`                                               | `currency.currencies` | — (reference data)                                                                                                                                                                                       |
| `Wallets`        | `GET /spaces/:id/wallets`                                       | `wallet`              | All-time `balance` per wallet, current-month `total_income`/`total_spend`, `total_balance`, `delta_percent`; deleted wallets excluded                                                                    |
| `Categories`     | `GET /spaces/:id/categories`                                    | `category`            | `transaction_count` (all transactions, incl. deleted wallets), `limit: {id, name}` membership, `is_active`/`archived_at`, `sort`                                                                         |
| `Limits`         | `GET /spaces/:id/limits?time_zone=`                             | `limit`               | `spent`/`in_percent` per limit over the device zone's month returned as `period` (incl. deleted-wallet history), embedded category `name`/`icon`/`color`, `over_allocation`                              |
| `History.Recent` | `GET /spaces/:id/transactions/feed?from=1970…&to=2038…&limit=5` | — (RTK Query only)    | Home's latest five records of the whole history and their days' `net`; one entry shared with the initial-load gate, never paged further                                                                  |
| `History.Latest` | `GET /spaces/:id/transactions/latest`                           | `transaction.latest`  | Single most recent row (or `null`); tells "no transactions at all" apart from "none in this period"                                                                                                      |
| `History.Count`  | `GET /spaces/:id/transactions/count?from&to[&q]`                | — (RTK Query only)    | `summary.count` of the same `History.Feed` selection, initial balances included; the period picker's counter                                                                                             |
| `History.Feed`   | `GET /spaces/:id/transactions/feed?from&to&time_zone[&q]`       | — (RTK Query only)    | Cursor pages of rows (same row shape) with the selection's `summary` and each listed day's `net`; one entry per selection and load generation; the Transactions tab, its search and the Stats drill-down |
| `Members`        | `GET /spaces/:id/members`                                       | `member.members`      | Member rows and pending invite rows                                                                                                                                                                      |
| `Statistics`     | `GET /spaces/:id/statistics/{summary,trend,breakdown}`          | — (RTK Query only)    | Every transaction sum and count; category and wallet names, colors, archived and deleted state                                                                                                           |

"History" below means all of `History.Recent`, `History.Latest`,
`History.Count` and `History.Feed`; in the thunk-era columns and the
lifecycle section, `History.Range` is the former whole-period list.

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
outside the selection also starts a new generation. The replaced entry
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

"Stale" is what the server actually changes. "Refreshed today" is what the
client re-fetches after the mutation succeeds (only when the space context
is still the one the mutation ran against). Gaps are the difference.
Space-scoped endpoints are written without their `/spaces/:id` prefix.

| Successful mutation                 | Endpoint                                                                         | Stale                                                                                                                                                                    | Refreshed today                                                                                      | Gap                              |
| ----------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------- |
| Create transaction                  | `POST /transactions`                                                             | History; Wallets (balance, month totals, total, delta); Limits (spent, if expense in current month); Categories (`transaction_count`)                                    | `History.Recent`, Wallets, Limits, `History.Range` + `History.Latest` (via `dataRevision`)           | **Categories**                   |
| Delete transaction                  | `DELETE /transactions/:id`                                                       | Same as create                                                                                                                                                           | — (`deleteTransaction` exists in `transaction.api.ts`, no thunk or UI)                               | Whole row once wired             |
| Edit transaction                    | `PATCH /transactions/:id`                                                        | Same as create                                                                                                                                                           | — (new endpoint)                                                                                     | —                                |
| Create category                     | `POST /categories`                                                               | Categories                                                                                                                                                               | Categories                                                                                           | —                                |
| Edit category (name/icon/color)     | `PUT /categories/:id`                                                            | Categories; Limits (embedded category); History (embedded category)                                                                                                      | Categories, `History.Range`, `History.Latest`                                                        | **Limits**, **`History.Recent`** |
| Archive category                    | `PUT /categories/:id` with `is_active: 0`                                        | Categories; Limits (category unlinked, limit deleted if it was its last category); History (embedded category)                                                           | Categories, `History.Range`, `History.Latest`                                                        | **Limits**, **`History.Recent`** |
| Restore category                    | `PUT /categories/:id` with `is_active: 1`                                        | Categories; History (embedded category). Limit membership is not restored.                                                                                               | Categories, `History.Range`, `History.Latest`                                                        | **`History.Recent`**             |
| Delete category → archived          | `DELETE /categories/:id`, `{archived: true}`                                     | Same as archive                                                                                                                                                          | Categories                                                                                           | **Limits**, **History**          |
| Delete category → removed           | `DELETE /categories/:id`, `{archived: false}` (only when it has no transactions) | Categories; Limits (category unlinked, limit deleted if it was its last category)                                                                                        | Categories                                                                                           | **Limits**                       |
| Reorder categories                  | `PUT /categories/reorder`                                                        | Categories                                                                                                                                                               | Categories                                                                                           | —                                |
| Create / edit / delete limit        | `POST`, `PUT`, `DELETE /limits[/:id]`                                            | Limits; Categories (`limit: {id, name}` of every category added, removed or renamed)                                                                                     | Limits                                                                                               | **Categories**                   |
| Create wallet, zero start           | `POST /wallets`                                                                  | Wallets                                                                                                                                                                  | Wallets                                                                                              | —                                |
| Create wallet with starting balance | `POST /wallets`, response has `transaction`                                      | Wallets; History (an income transaction in the hidden system category, timestamped now). Limits and Categories are unaffected (income, system category is never listed). | Wallets, `History.Range`, `History.Latest`                                                           | **`History.Recent`**             |
| Edit wallet                         | `PUT /wallets/:id`                                                               | Wallets; History (embedded wallet)                                                                                                                                       | Wallets, `History.Range`, `History.Latest`                                                           | **`History.Recent`**             |
| Delete wallet (soft)                | `DELETE /wallets/:id`                                                            | Wallets (row gone, total and delta change); History (embedded wallet becomes `null`). Limits and Categories keep counting its history.                                   | Wallets, `History.Range`, `History.Latest`                                                           | **`History.Recent`**             |
| Invite member                       | `POST /spaces/:id/invites`                                                       | Members                                                                                                                                                                  | Members                                                                                              | —                                |
| Revoke invite                       | `DELETE /spaces/:id/invites/:inviteId`                                           | Members                                                                                                                                                                  | Members                                                                                              | —                                |
| Remove another member (owner)       | `DELETE /spaces/:id/members/:userId`                                             | Members; Spaces (`member_count`)                                                                                                                                         | Members, Spaces                                                                                      | —                                |
| Leave space                         | `DELETE /spaces/:id/members/:self`                                               | Spaces (space gone, or ownership moved to the oldest member); active space may no longer be accessible                                                                   | `activateSpace(null)`, then Spaces, whose fallback activates the next space and reloads all its data | —                                |
| Accept invite                       | `POST /spaces/invites/accept`                                                    | Spaces; the joined space becomes active                                                                                                                                  | Activates the joined space, then Spaces                                                              | —                                |
| Create space                        | `POST /spaces`                                                                   | Spaces; the new space becomes active                                                                                                                                     | Activates it, then Spaces                                                                            | —                                |
| Delete space                        | `DELETE /spaces/:id`                                                             | Spaces; fallback if it was active                                                                                                                                        | Spaces (fallback via `fetchSpaces`); thunk exists, no UI                                             | —                                |

A space activation (switch, create, accept, leave) makes every space-scoped
resource stale; sign-in and sign-out make everything stale. Both are
described in the lifecycle section.

### Staleness with no local mutation

- **Other members of a shared space.** Home, Transactions, Limits and
  Categories call `useSpaceRefresh`: a return to the screen, or to the app
  while it shows one of them, invalidates the space's `Transactions`,
  `Wallets`, `Limits` and `Categories` (`refreshSpaceData`), at most once
  every 30 s per space. Stats follows through its revision and also
  restarts its own cycle when it is older than 30 s. Open details are read
  again on a return to the app; a form being edited keeps its draft.
- **Month rollover.** `useSpaceRefresh` also wakes when a new month begins:
  it renders the screen again, so a current period moves onto the new
  month, and refreshes the space's data regardless of the 30 s limit.

## Notes for the RTK Query design

- Every transaction read and write result is the backend's transaction
  view (`docs/transactions-contract.md`): `kind`, `version`, a nullable
  `wallet` and a compact `category` without `transaction_count`, `limit`
  or `sort`, mapped to `TransactionCategoryModel` rather than the
  Categories API's `CategoryModel`. `wallet_id` and `category_id` are not
  in it.
- A transaction created outside the currently cached period does not
  change `History.Recent`/`History.Feed` rows, but invalidating them
  anyway is correct and cheap; no need to match on timestamps.
- An income transaction does not change Limits; a per-type rule is
  possible but not required.

## Statistics

The three Stats blocks are one load cycle (`src/screens/Stats/hooks/useStatsData.ts`):
the same space, period, zone and `as_of`, per the backend's
`docs/statistics-contract.md`. Because `as_of` is part of every argument, the
blocks provide no tags; a refetch of the same arguments would miss anything
recorded after that `as_of`. Instead `getStatisticsRevision`, a local query with
no request, provides the space's `Transactions`, `Wallets` and `Categories`
tags, and each new value starts a new cycle. So does a return to the screen or
to the app on it, when the cycle is older than 30 seconds.

A new cycle for the same space and period keeps each block's last successful
result on screen, flagged as updating or, if its request failed, as not
updated. A new space, period or zone drops them in the same render.

## Current lifecycle behavior

What the hand-written slices and hooks do today. RTK Query replaces most of
this machinery, so each point here is either something to keep or
something to drop on purpose.

### Loading

- **Boot.** `useAuth` dispatches `checkAuth` (token from SecureStore; a
  read failure counts as signed out). `RootNavigator` shows
  `LOADING_SCREEN` while that runs or while `useLoadInitData` reports
  loading.
- **Sign-in.** `useLoadInitData` dispatches `fetchSpaces` and
  `fetchProfile`. `fetchSpaces` keeps the current space if it is still in
  the list, otherwise activates the personal space, otherwise the lowest
  id. Every change of `currentSpaceId` then dispatches `fetchWallets`,
  `fetchLimits`, `fetchCategories` and `fetchTransactions` (`History.Recent`).
- **Initial-load gate.** The app stays on `LOADING_SCREEN` only for the
  first load: spaces while no space is selected yet, each of wallets,
  limits, categories and recent history while `isLoading && !hasLoaded`,
  and profile while loading. `hasLoaded` survives space switches, so
  background refreshes and switches never re-show the loading screen
  (which would remount the whole signed-in navigator).
- **Screen-owned fetches.** The Transactions tab fetches `History.Range`
  and `History.Latest` on mount and whenever the period, the space or
  `transaction.dataRevision` changes; `dataRevision` is bumped by
  `transactionsInvalidated` after mutations that affect history. The
  Members screen fetches `Members` on mount and on space change. Sign-up
  and Create Space fetch `Currencies` on mount.
- **Returns and a new month.** See "Staleness with no local mutation"
  above; there is no refetch on reconnect, pull-to-refresh or interval.
- **Stale responses.** Each list fetch stores its `requestId` on pending
  and ignores a fulfilled/rejected action with a different id, so an older
  request cannot overwrite a newer one. `fetchSpaces` additionally only
  runs its fallback activation if it is still the current request.
  `fetchCurrencies` has no such guard.
- **What a refresh looks like.** Home, Limits and Categories show a
  spinner only while their list is empty; a background refresh keeps the
  old data on screen with no indicator. `History.Range` clears its rows
  when the period changes but keeps them for a refresh of the same period,
  yet the Transactions screen still swaps to its skeleton for every range
  fetch. `History.Latest` resets to `undefined` on every fetch. Members
  exposes a separate `isRefreshing` state.
- **Mutation state.** `isCreating` (transaction) and `isDeleting` (limit,
  category) live in the slices; other forms track submission locally. A
  failed wallet/category/limit mutation writes the same slice `error` the
  list fetch uses; member mutations keep their errors local on purpose.

### Errors and retry

- **No automatic retries.** Every retry is a user action.
- **Manual retry, shown only when there is no data to fall back on:**
  Home recent activity (`fetchTransactions`), Home wallets
  (`fetchWallets`), Limits (`fetchLimits`), Categories (`fetchCategories`),
  Transactions period and latest (separate `rangeError` / `latestError`
  states with their own retry), Members (`fetchMembers`). When a refresh
  fails while data is present, the old data stays and the error is not
  shown.
- **No retry at all** for `fetchSpaces` or `fetchProfile`. If the initial
  `fetchSpaces` fails, no space is ever activated and nothing space-scoped
  loads until the next sign-in. If `fetchProfile` fails, leaving a space
  rejects without a request because the caller's user id is unknown.
- **Network failures** are turned into a truthy `ErrorResponse`
  (`statusCode: 0`) by `getRejectValue`, so they never look like an empty
  successful result.
- **401** from the axios instance dispatches `logoutMe`, but only if the
  request carried the token that is still stored.
- **429** shows a global alert; `inviteMember` additionally starts a
  cooldown from `Retry-After` that outlives space switches.

### Space switch

- `activateSpace(id)` is the only way to change the active space; activating
  the current space is a no-op. Triggers: `SpaceSwitcher`, the
  `fetchSpaces` fallback, `addSpace`, `acceptInvite`, `leaveSpace`.
- It dispatches `spaceContextChanged` with a new, never-reused
  `contextKey`. In the same reducer pass wallet, category, limit and
  transaction reset to their initial state except `hasLoaded` and set
  `isLoading: true`; member resets fully (including `hasLoaded`) except the
  invite cooldown. Spaces, profile and currencies are kept.
- Dropping `requestId` in that reset is what makes a late response for the
  previous space unmatchable.
- Mutation thunks capture `contextKey` before their request and skip their
  follow-up refreshes and `transactionsInvalidated` if it changed while
  the request was in flight.
- After the switch the new space's data loads through the same effects as
  on sign-in (`useLoadInitData`, plus the Transactions and Members screens
  if mounted).

### Sign-out

- Triggered from Settings or by a 401. `logoutMe` deletes the token
  (a storage failure still logs out) and, on fulfilled, every slice resets
  to its initial state. `space.contextKey` keeps counting up and
  `auth.sessionKey` is incremented, so nothing from the ended session can
  match the next one.
- `RootNavigator` swaps to the auth stack, unmounting every signed-in
  screen.
- In-flight requests: list fetches are dropped by the `requestId` reset;
  `addSpace`, `acceptInvite` and `leaveSpace` check `isSessionActive`
  before activating anything; `inviteMember` checks `sessionKey` so a late
  429 can't start a cooldown in the next session.
- There is no server-side logout call; the token is only forgotten
  locally.
