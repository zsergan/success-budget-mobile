# Toasts

One toast at a time, for the whole app (`src/components/Toast/`). There is
no queue: a message either shows now or is dropped.

## Showing one

- In a component, `useToast()` (`src/hooks`). Take a ticket with
  `begin()` when the work starts and show its outcome through it; `show`
  is only for something already done. Outside React (the HTTP client, the
  theme writer), `beginToast()` from `globalToast.ts` gives the same ticket.
- A ticket belongs to the screen occurrence, session, space and foreground
  period it was taken in. Leaving the screen (Back, another tab, a pushed
  screen), logging out, switching space or backgrounding the app ends it,
  for good: coming back does not revive its toast or its actions.
- A result that closes sheets uses `showAfterSheetsClose`, so it appears
  once every sheet has finished closing. A result that navigates uses
  `showAfterNavigation` right before navigating; it is dropped unless that
  navigation follows within a second.
- Give a message a `subject` (e.g. `transaction-delete:42`) when a later
  result may replace it, and `resolve(subject)` to take away an error the
  result has settled before showing what came of it.
- An error belonging to an open sheet stays inline in the sheet, never a
  toast.

## Lifecycle

- Types: success (optional action), info (no action), warning (required
  action), error (optional action, a close control, no timer). Durations
  and priority live in `policy.ts`.
- The same type, subject, text and owner shown again keeps one toast and
  restarts its timer. Success and info never push out a warning or an
  error, and a warning never pushes out an error; the newer message is
  dropped.
- A touch pauses the timer; a swipe closes any toast. The action runs once
  and closes the toast.

## Placement

`ToastHost` is rendered after the bottom sheets' portal host
(`RootNavigator`), so it draws above sheets and their backdrops. It sits
at the top while any sheet is on screen, closing included (tracked by
`ToastSheetPresence` inside `BottomSheetModal`); otherwise 12 above the
keyboard, the measured tab bar (`MainNavigator`) or the bottom safe area,
or 16 from the bottom without one.

## Tests

Advance fake timers in small steps (see `ToastProvider.test.tsx`): `act`
renders a timer's state change only when its callback ends, so one long
advance would start an exit animation late.
