# Launch

From a cold start or a sign-in to Welcome or the app. The state lives in the
`launch` slice (`src/redux/state/launch/`), one attempt at a time; the screen
for it is `src/screens/Launch/`.
`RootNavigator` starts an attempt when it mounts and again when a session
begins on Welcome; the store itself starts none, so a store built in a test
sends nothing on a sign-in.

## Stages

1. **Resources** — the Plus Jakarta Sans fonts, loaded from the app bundle
   (`src/shared/fonts.ts`). The system launch screen stays up until they
   settle, so the first frame never swaps its typeface.
2. **Stored session** — the token in SecureStore. None saved: Welcome, with
   no request. Unreadable, or no answer by the deadline: a failure to retry,
   never "signed out". Only the read of the current attempt may settle the
   session; a late one, after a timeout, a newer attempt, a sign-in or a
   logout, changes nothing.
3. **Session** — `GET /users/profile`. A `401` (`code: UNAUTHORIZED`) ends
   the session through the HTTP client and opens Welcome; no other status
   signs the user out.
4. **Required data** — the spaces list and, when there is a space, its
   wallets (Home's balance has no loading or error state of its own). An
   empty spaces list opens the app. Categories, limits and recent records
   load after entry; their blocks show their own states.

An attempt is cut off after 30 s (each request keeps its own 20 s timeout),
its requests are cancelled, and anything an older attempt or an ended
session reports is ignored. Try again starts one new attempt and reuses
what earlier stages already loaded; after a 429 it waits for Retry-After.

Failures are told apart by what the user can do: `offline` only when NetInfo
confirms the internet is unreachable, `unreachable` for no answer or a
timeout, `server` for a 5xx or an unexpected 4xx, `rateLimited`, `storage`
and `resources`.

## System launch screen and first frame

There is no minimum display time. The native splash is hidden on the first
layout of the navigator (`RootNavigator`), or by `ErrorBoundary` on a crash;
waiting and errors are shown by the Launch screen, which is interactive.

The images come from the mark geometry: `npm run brand:assets` writes them to
`assets/` (see `scripts/export-brand-assets.mjs`).

|                      | iOS                                                                           | Android 12+                                                                    |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| System launch screen | Mark, name and tagline in one 260pt image, its centre 38pt above the screen's | The mark alone, 74dp wide, at the window's centre                              |
| Why                  | The storyboard centres an image of any content                                | The system draws only an icon, clipped to a 192dp circle inside a 288dp square |
| First frame          | The same lockup at the same place; nothing moves                              | The mark at the window's centre, the name and tagline fading in under it       |
| Background           | `#F6F7F9` (`colors.bg`)                                                       | `#F6F7F9`                                                                      |

So the Android lockup sits lower than the design's frame: moving the mark up
after the system splash would be a visible jump.

## Theme

The app is light only (`userInterfaceStyle: light`, `colorScheme` in
`src/shared/theme.ts`), so the launch is light too. `splash-ios-dark.png` and
`splash-android-dark.png` are exported for when the app gets a dark theme;
they go into the `expo-splash-screen` plugin's `dark` keys together with
that change, never on their own.
