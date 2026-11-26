# Transactions: assignment, writes and recovery

A transaction belongs to its space, records who entered it (`author`) and
is assigned to a member, the whole space or nobody (`assignment`), for
income and expenses alike. There are no wallets. The server contract is
the backend's `docs/transactions-v2-contract.md`; caching and invalidation
are in `docs/server-data.md`, the sheet and editor route in
`docs/sheets.md`.

## Author and assignment

- The author is set by the server on create and never sent by the app,
  so an edit or a reassignment cannot change it. Details show the author
  and the assignee as separate rows. An author with `source: 'imported'`
  was filled in when wallets were retired: it names whom the record was
  given to, not who entered it, and the row and details say so.
- A list row names the assignee, except the user's own records in their
  personal space; the whole space and nobody are always named, so the
  personal history tells shared and unassigned records apart. A starting
  balance (`kind: initial_balance`) is read-only and shown as archived,
  with no assignee.
- The picker (`AssignmentPicker/assignmentOptions.ts`) offers Whole space
  first, then the signed-in user, the other current members (never a
  pending invitation), an edited record's own former member or deleted
  account, and No member assigned last. Until the members load it offers
  the user alone among people; a long list shows five people and the
  picked one, in that order, with the rest behind More. Two people of one
  name are told apart by email. In a space with nobody else, the user's
  own pick stays one row until opened.

## Defaults and changes

- A new transaction is assigned by the type of the flow's space
  (`defaultAssignment`): Whole space in a group space, even one with only
  the user, and the user in a personal space. While the space's type or
  the profile is not known, Whole space. The default is read once, when
  the form starts: members or the profile loading later never change it.
- Add another repeats the last assignment (`keptAssignment`): Whole space
  and No member assigned always, a member while still known to be in the
  space; otherwise the space's default. Neither default touches an edit,
  a restored draft or a pending write's body.
- An edit starts from the record. A former member or a deleted account it
  is assigned to stays on offer, marked as gone, only while unchanged: an
  update leaves out an assignment it does not change, and a deleted
  account, having no id, can be kept only that way.
- A member picked in the form who leaves the space is no longer valid once
  the members are read again (`getDraftErrors`): the form asks for a new
  pick before saving. If the server refuses the save with
  `ASSIGNEE_NOT_MEMBER`, the pick is cleared, the rest of the draft is
  kept and Members are read again.
- A saved record that no longer fits the screen it was opened from (its
  period, type, category or assignment filter, `whereSaved`) is reported
  as such; History reveals it around its position (`around_id`).

## Dates

- A transaction has a calendar `date`, no time of day. Every view shows it
  as stored (`formatTransactionDate`: Today, Yesterday, Aug 29, the year
  only when it is not this one); History groups rows under day headers by
  that date, and Home's preview names each row's own date.
- A new transaction is dated today, also when the form opens over an
  earlier month on Home (the form says which month is behind it). While no
  date is picked (`followsToday`), the draft moves onto the new today past
  midnight and on a return to the app (`todayChanged`), and Add another
  takes the new today; a picked date is kept for Add another and is never
  changed by the app. Nor is the date of a draft whose save is running or
  has an outcome to show.
- The Date sheet picks one day: Today, Yesterday or the calendar, with no
  day after today on offer. Apply moves it into the draft; Cancel, Back and
  a swipe keep the draft's date.
- An edit sends the date with the device's zone; an unchanged date is no
  change to the server, even one after today. A resend of a write sends
  exactly the stored body, its `time_zone` included, and the same draft
  saved again reuses that write whatever zone the device is in now.
- Period checks (saved outside the viewed period, reveals, limit
  forecasts, empty periods) compare dates directly.

## Writes

Every create, edit and delete goes through
`src/redux/state/transaction/operations.ts`:

- Each logical write gets one `Idempotency-Key`, reused by every retry of
  the same request, so a lost answer never applies it twice. A create
  sends the key as `client_operation_id` too, which the server can be
  asked about (`GET …/transactions/operations/:id`).
- An edit or a delete sends the version it was based on (`If-Match`). A
  change made elsewhere meanwhile is a conflict: the draft is kept as
  typed and the user loads the latest version. A record deleted elsewhere
  ends the edit; a delete that finds it gone did what it was for.
- No answer, a timeout or a `5xx` is `uncertain`: the write may have
  applied. Saving the same draft again resends it under the same key; a
  changed draft first settles the earlier attempt, and if that had
  created the record the form switches to editing it, so the change is
  saved as an edit instead of a second record.
- An edit or a delete of a record first settles that record's earlier
  writes whose outcome is unknown, each with its own key and version,
  also while the stored writes are still being read back. While one stays
  unknown the new one is not sent (`blocked`).
- When one of them applied, or met a newer version, the new write is not
  sent either: the record is read again with a fresh request (a replayed
  answer may predate another member's change), and the editor now edits
  that version with the typed values kept (`recordChanged`); Save sends
  them against it. A delete shows the record as it is now and asks again.
  An earlier delete that went through ends an edit as gone and a delete
  as already done. A read that fails sends nothing (`saveUnverified` in
  the editor, a change to load in the details); the next Save reads it
  again first.
- Undo on a new record's confirmation is a delete at the version the
  create returned.
- A write remembers its session and space. An answer after either changed
  surfaces nothing on screen; the write itself is still settled.

## Pending writes

Every write is stored per user in AsyncStorage before it is sent, and
nothing is sent when it cannot be stored. It stays until its outcome is
known (`pendingWrite` slice, `storage.ts`), and a resend sends exactly the
stored body, its date and `time_zone` included:

- Writes with no known outcome are sent again with their own key on the
  next launch and on every return to the app (`usePendingWritesSync`);
  `PendingWritesBanner` offers a check meanwhile.
- A create whose key outlived its server lifetime is looked up by its
  operation id instead of being resent; one the server has no trace of
  waits for the user to send it again under the same id.
- A check of a create by its operation id and a send of it take turns
  under one lock per account, space and operation (`runningWrites`): a
  Save during a check waits for its answer (applied: the record is shown;
  deleted: the create is dropped; missing: it is sent once), and a check
  or another send during a send joins it. A check's answer applies only
  to the attempt it was made for, so it never marks a resend that is
  still unanswered as unsaved, nor brings back a discarded draft. A
  resend still unanswered when the app closes is checked by its
  operation id on the next launch before anything is sent.
- A create in a space the user lost stays stored, offered for review and
  discarding only; it can be saved nowhere.
- Writes outlive a logout and wait for the same user's next session;
  another user's are never read or sent.

## Upgrading from earlier builds

Earlier builds stored pending writes in their own formats:
`pendingTransactionWrites.v1.<userId>` (before v2: v1 bodies, a create
naming its wallet) and `pendingTransactionWrites.v2.<userId>` (before
calendar dates: v2 bodies dated by a `timestamp` instant). Their types are
spelled out in `pendingWrite/historical.ts`, apart from the current request
types. When the user's writes are first read after the upgrade,
`pendingWrite/legacy.ts` converts them into the current format
(`pendingTransactionWrites.v3.<userId>`); a write already in the current
format wins over a converted copy of the same key. The old keys are removed
only after a save of the state holding the converted writes has succeeded,
so a failed save converts them again next time, never twice. A stored value
that cannot be read at all is left where it is.

- **Dates.** Every instant, in a body or in a record a create was found to
  have made, becomes the day it had in `America/Chicago`, where the
  existing history was entered and by which the server dated it, whatever
  zone the device is in now. A converted date is sent with
  `time_zone: America/Chicago`, so it is never after today for the
  server, and the body stays the same on every later retry; a restored
  draft keeps that zone until the user picks another date.
- Operation ids, keys, spaces, record ids, versions and the time a write
  was first sent are kept as they were.
- **Creates** keep their operation id and are looked up by it before
  anything is sent (`checking`): if one had applied, the banner offers the
  current record (`found`); if it applied and was deleted since, it is
  dropped; if the server has no trace of it, its draft waits for the user
  to review and send it under the same id (`retry`). No answer keeps it
  `checking`; it is never taken as missing. A create an older build left
  is assigned to the whole space, as its body cannot say whom it was for.
- **Edits and deletes** go out again through v2 at their version with their
  own key. A record changed since is refused with a version conflict, so
  nothing is overwritten, and the space's history is read again. The wallet
  part of a wallet-era edit is dropped; one that only moved the record to
  another wallet is dropped, the user is told once, and the space's data is
  read again.

`legacy.ts` is the only place that knows the old formats; it reads stored
values defensively and drops anything that is not a write an older build
could have stored, or whose instant cannot be read.
