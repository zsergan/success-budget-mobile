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
known (`pendingWrite` slice, `storage.ts`):

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

## Upgrading from builds before v2

Builds before v2 stored v1 bodies, with a create naming its wallet, under
`pendingTransactionWrites.v1.<userId>`. When the user's writes are first
read after the upgrade, `pendingWrite/legacy.ts` converts them once into the current
format; the old key is removed only after the converted writes are
stored, so a failed save converts them again next time, never twice.

- A create is assigned to the whole space, as the old body cannot say
  whom it was for, keeps its operation id and is looked up first
  (`checking`): if it had applied, the banner offers the record (`found`);
  if it applied and was deleted since, it is dropped; if nothing applied,
  its draft waits for the user to review and send it (`retry`).
- An edit or a delete is sent again through v2 at its version with its own
  key; the wallet part of an edit is dropped. An edit that only moved the
  record to another wallet is dropped, the user is told once, and the
  space's data is read again.

`legacy.ts` is the only place that knows the old format; it reads the
stored value defensively and drops anything that is not a write an older
build could have stored.
