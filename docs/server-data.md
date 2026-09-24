# Server data: dependencies and invalidation

Reference for moving server data onto RTK Query. It records which cached
data each successful mutation makes stale, based on the backend services
(`success-budget-backend`, `main` at `fd0d717`) and on the Redux thunks in
`src/redux/state/*/thunks.ts` at `f9cc9c1`.

## Cached resources

Every resource except Profile and Currencies is scoped to the active space.

| Key              | Endpoint                                                   | Client state today              | Contents that other mutations can change                                                                                                |
| ---------------- | ---------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Spaces`         | `GET /spaces`                                              | `space.spaces`                  | Caller's `role`, `member_count`, space list itself                                                                                      |
| `Profile`        | `GET /users/profile`                                       | `profile`                       | — (no mutation endpoint)                                                                                                                |
| `Currencies`     | `GET /currencies`                                          | `currency.currencies`           | — (reference data)                                                                                                                      |
| `Wallets`        | `GET /spaces/:id/wallets`                                  | `wallet`                        | All-time `balance` per wallet, current-month `total_income`/`total_spend`, `total_balance`, `delta_percent`; deleted wallets excluded   |
| `Categories`     | `GET /spaces/:id/categories`                               | `category`                      | `transaction_count` (all transactions, incl. deleted wallets), `limit: {id, name}` membership, `is_active`/`archived_at`, `sort`        |
| `Limits`         | `GET /spaces/:id/limits`                                   | `limit`                         | Current-month `spent`/`in_percent` per limit (incl. deleted-wallet history), embedded category `name`/`icon`/`color`, `over_allocation` |
| `History.Recent` | `GET /spaces/:id/transactions` (no params → current month) | `transaction.transactions`      | Rows with embedded `wallet` (null once deleted) and `category`; Home shows the first `RECENT_TRANSACTIONS_LIMIT`                        |
| `History.Range`  | `GET /spaces/:id/transactions?from&to`                     | `transaction.rangeTransactions` | Same row shape, for the period picked on the Transactions tab; period totals are derived from it client-side                            |
| `History.Latest` | `GET /spaces/:id/transactions/latest`                      | `transaction.latest`            | Single most recent row (or `null`); tells "no transactions at all" apart from "none in this period"                                     |
| `Members`        | `GET /spaces/:id/members`                                  | `member.members`                | Member rows and pending invite rows                                                                                                     |

"History" below means all three of `History.Recent`, `History.Range` and
`History.Latest`.

## Invalidation rules

"Stale" is what the server actually changes. "Refreshed today" is what the
client re-fetches after the mutation succeeds (only when the space context
is still the one the mutation ran against). Gaps are the difference.
Space-scoped endpoints are written without their `/spaces/:id` prefix.

| Successful mutation                 | Endpoint                                                                         | Stale                                                                                                                                                                    | Refreshed today                                                                                      | Gap                              |
| ----------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------- |
| Create transaction                  | `POST /transactions`                                                             | History; Wallets (balance, month totals, total, delta); Limits (spent, if expense in current month); Categories (`transaction_count`)                                    | `History.Recent`, Wallets, Limits, `History.Range` + `History.Latest` (via `dataRevision`)           | **Categories**                   |
| Delete transaction                  | `DELETE /transactions/:id`                                                       | Same as create                                                                                                                                                           | — (`deleteTransaction` exists in `transaction.api.ts`, no thunk or UI)                               | Whole row once wired             |
| Create category                     | `POST /categories`                                                               | Categories                                                                                                                                                               | Categories                                                                                           | —                                |
| Edit category (name/icon/color)     | `PUT /categories/:id`                                                            | Categories; Limits (embedded category); History (embedded category)                                                                                                      | Categories, `History.Range`, `History.Latest`                                                        | **Limits**, **`History.Recent`** |
| Archive category                    | `PUT /categories/:id` with `is_active: 0`                                        | Categories; Limits (category unlinked, limit deleted if it was its last category); History (embedded category)                                                           | Categories, `History.Range`, `History.Latest`                                                        | **Limits**, **`History.Recent`** |
| Restore category                    | `PUT /categories/:id` with `is_active: 1`                                        | Categories; History (embedded category). Limit membership is not restored.                                                                                               | Categories, `History.Range`, `History.Latest`                                                        | **`History.Recent`**             |
| Delete category → archived          | `DELETE /categories/:id`, `{archived: true}`                                     | Same as archive                                                                                                                                                          | Categories                                                                                           | **Limits**, **History**          |
| Delete category → removed           | `DELETE /categories/:id`, `{archived: false}` (only when it has no transactions) | Categories; Limits (membership)                                                                                                                                          | Categories                                                                                           | **Limits**                       |
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

- **Other members of a shared space.** Nothing is re-fetched on screen
  focus, app foreground, pull-to-refresh or a timer, so their changes only
  appear after the next local mutation that happens to refresh the same
  resource, or a space switch / re-login.
- **Month rollover.** Wallets month totals, Limits and `History.Recent`
  are computed by the server for the month containing "now". If the app
  stays open across the boundary they keep showing the previous month.

## Notes for the RTK Query design

- `POST /transactions` returns the bare transaction with no `wallet` or
  `category` relation, so it can't be inserted into a cached history list
  as-is; invalidating is the straightforward option.
- A transaction created outside the currently cached period does not
  change `History.Recent`/`History.Range` rows, but invalidating them
  anyway is correct and cheap; no need to match on timestamps.
- An income transaction does not change Limits; a per-type rule is
  possible but not required.
- `PUT /wallets/:id` responds with an empty body (the service returns
  `void`), while `updateWallet` types the response as `Wallet`. Nothing
  reads the value today.
- Backend, found while reading, not reproduced: the "removed" branch of
  `DELETE /categories/:id` deletes the row without unlinking it from its
  limit, and `limit_categories.category_id` is `ON DELETE RESTRICT`. A
  category with no transactions that belongs to a limit should therefore
  fail to delete with a server error.

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
- **No other triggers.** No refetch on screen focus, app foreground,
  reconnect, pull-to-refresh or interval (see "Staleness with no local
  mutation" above).
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
