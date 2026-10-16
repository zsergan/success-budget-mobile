# Password recovery

A user who forgot their password gets a six-digit code by email, types it
into the app and sets a new password. There are no reset links, deep links
or web pages. The backend contract is `docs/password-reset-contract.md` in
`success-budget-backend`; the app follows it as merged in
success-budget-backend#71.

## Flow

Sign In → **Forgot password** (`ForgotPasswordScreen`) → **code entry and
resend** (`ResetCodeScreen`) → **new password** (`NewPasswordScreen`) → Sign
In. The screens live in `src/screens/Auth/Screens/`; what they share
(failure mapping and banner, request and countdown hooks, the keyboard
layout rule) is in `src/screens/Auth/passwordReset/`.

- "Forgot password?" passes the Sign In email along only when it is a
  complete address.
- Every address gets the same `202`, so the code screen always opens; no
  answer tells whether an account exists.
- Next is on only with six digits and moves on only after the server
  accepts the code.
- A completed reset pops every recovery screen and opens Sign In with the
  address, an empty password and "Password updated.". Nothing signs in;
  Back from there goes to Welcome, never to the password form.

## State

The `passwordReset` slice (`src/redux/state/passwordReset/`) holds the
address the latest accepted request went to, when the next code may be
requested, what this device saw of the code's challenge, and the reset
authorization. It is apart from `auth.userEmail`, which belongs to sign-up's
email verification.

- **Secrets stay in memory.** The mutations run with `track: false`, so no
  code, token or password stays in the RTK Query cache. The authorization
  is never persisted, logged or put in route params.
- **Cleared on leaving.** Leaving the email screen (back to Sign In, or by
  finishing) ends the flow; leaving the password screen discards the
  authorization; editing the email to another address clears the code,
  cooldown and authorization.
- **One request per screen.** A new attempt, an edited address or leaving
  the screen aborts the request before it (`useLatestRequest`), so a late
  answer never moves the flow or revives it.

## Rules the client keeps

- **Address.** Trimmed and lower-cased; any other difference, an accent
  included, is another address. `isSameEmail` is the server's
  `normalizeEmail`.
- **Resend** is a deadline (`resendAvailableAt`) from `resend_after_seconds`
  or a `429`'s `Retry-After`, read from the clock on every tick and on
  return to the app. Going back to the email and forward again with the same
  address keeps the code and its cooldown without a new request.
- **Why a code stopped working.** The server answers expiry, five wrong
  codes and an already used code alike (`PASSWORD_RESET_CODE_UNUSABLE`).
  The slice counts the wrong codes it saw since the challenge started and
  when it first saw it, so the screen says "expired" or "too many wrong
  attempts" only when that is certain, and a general message otherwise.
  The server does not say how many attempts are left.
- **Only the server blocks a code.** A `202` does not say whether it
  started a new challenge or which expiry it has, so no local deadline
  disables the field or Next; the block follows an `UNUSABLE` answer. After
  a check that got no answer (it may have been accepted, or been the fifth
  wrong code), the next request may have started a fresh 30 minutes, so the
  slice stops vouching for that challenge (`isKnown`): it restarts the
  count from that request and never says "too many wrong attempts" for it.
- **Expired authorization** (`PASSWORD_RESET_AUTHORIZATION_INVALID`, or
  past its local expiry before sending) goes back to the code screen,
  which offers a new code.
- **A lost save** (timeout or no connection) may still have changed the
  password, so it never reads as success or failure: retry, or sign in with
  the new password. A refused retry after it opens Sign In with "Your
  password may have changed" and Reset again.
- **Password** rules are the backend's: 8+ characters, a letter, a digit,
  at most 72 bytes in UTF-8. Sign In keeps its older minimum of six for
  existing accounts.
- **Rate limits.** Every `429` of these routes is explained on its screen
  with its wait, so the global rate-limit alert stays quiet for them.

## Layout

With the keyboard up the illustration folds away and the form's action is
pinned above the keyboard (`RootLayout`'s `footer`). On a screen under 700
points tall the subtitle, the email chip, the resend note and secondary
actions fold away too (`useKeyboardLayout`). Code digits stop growing at
1.3x the text size, so they stay inside their boxes.

## Tests

`src/screens/Auth/passwordReset/passwordResetFlow.test.tsx` runs the whole
flow through the real navigator against a mocked HTTP client (helpers in
`flowFixtures.tsx`); each screen has its own test file beside it, and the
slice and endpoints are covered in `src/redux/state/passwordReset/`.
