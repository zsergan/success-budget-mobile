# Sheets and confirmations

Every modal surface is a `@gorhom/bottom-sheet` modal wrapped by
`src/components/Modals/BottomSheetModal/BottomSheetModal.tsx`. App
confirmations and messages use `ConfirmationSheet`
(`src/components/ConfirmationSheet/`), never `Alert.alert`; native
interactions (share sheet, date/time pickers) stay native. These are the
constraints that are easy to break when adding a caller.

## Showing and hiding

- Drive a sheet from state with `useSheetPresence(isVisible)`, not by
  calling `present()`/`dismiss()` yourself. The library leaves a sheet that
  was dismissed before it was shown, or after it already closed, stuck
  dismissing, and its next `present()` renders nothing.
- Its `settleDismiss()` goes in the sheet's `onDismiss`. It returns true
  only when the sheet closed itself (swipe, backdrop), so the owner can
  treat that as a cancel, while a close the owner asked for is not one.
- Keep rendering the last content while the sheet animates away
  (`ConfirmationSheet` and `WalletActionsSheet` cache it); the owner's
  value is already null by then.

## Keyboard

A sheet that rises with the keyboard stays risen if it renders as the
keyboard starts to go (a race in the library). Open a sheet from a screen
that may have the keyboard up through `afterKeyboardHides`
(`src/shared/utils/keyboard.ts`), as `useConfirmation` and `InputPicker`
do: it dismisses the keyboard and shows the sheet once it has gone.

## Stacking

- `ConfirmationSheet` is the only sheet that opens over another one
  (`stackBehavior="push"`): the sheet below stays in place with its state,
  e.g. a transaction draft. Only the top sheet takes a swipe or the
  backdrop, and `useBackPress` gives Android Back to the most recently
  enabled handler alone.
- Anything else a sheet leads to (another sheet, a screen) waits until that
  sheet has gone: close it, then act from its `onDismiss`
  (see `useWalletActions`).

## Pending actions and stale confirmations

- An action whose `onPress` returns a promise locks every action, the
  swipe, the backdrop and Back until it settles, for that opening only: an
  action an earlier opening left running neither holds a later one nor,
  settling, unlocks it. While the owner's request
  runs (`isPending`) the primary action shows it and the same things are
  blocked, unless `isDismissible` allows closing meanwhile. The owner
  hiding the sheet always closes it.
- A confirmation belongs to the scope it was asked in, and is dropped for
  good once that changes, even if the scope comes back: the session and space for `useConfirmAction` and
  `useConfirmation`, the draft and view for the transaction flow
  (`useFlowConfirmation`). Its `settle()` returns false when the choice no
  longer applies, and the caller must then do nothing.

## Tests

Real reanimated cannot load in Jest. Mock the sheet with
`@components/ConfirmationSheet/testing` (see its header); it tracks the
open sheets, and `holdDismissals()` keeps a closing sheet on screen so a
test can check that nothing opens before it has gone.
