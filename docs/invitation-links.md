# Invitation links

How an emailed space invitation reaches the app. The API side is the
backend's `docs/invitations-contract.md`.

## Links

| Form       | URL                                    | Opens the app through                                |
| ---------- | -------------------------------------- | ---------------------------------------------------- |
| Web link   | `<origin>/invite#token=<token>`        | iOS Universal Links (`applinks:` in `app.json`)      |
| App scheme | `successbudget://invite#token=<token>` | The `/invite` page's "Open in Success Budget" button |

- `<origin>` is the origin of the API base URL (`INVITE_LINK_ORIGIN`): the
  backend serves `/invite` from the root of its API host. `app.json` lists
  the staging host; production gets its `applinks:` entry with its API URL.
- `parseInviteLink` (`src/shared/utils/inviteLink.ts`) accepts only those
  two forms: that origin exactly, the path `/invite` exactly, and a token
  of the backend's shape (`<id>.<43 base64url characters>`). Anything else
  is ignored.
- Android App Links are off until the Android package and its signing
  certificate are confirmed (the backend does not serve `assetlinks.json`
  yet); the app scheme works there.

## Pending invitation

The `invitation` slice keeps the token and when it was kept, in
SecureStore (`sbm-PENDING_INVITATION`), never in navigation params,
toasts or logs. Storage follows every change of it.

| Event                                                                 | Pending invitation                      |
| --------------------------------------------------------------------- | --------------------------------------- |
| Link opened, signed in or not                                         | kept; another link replaces it          |
| The same link again                                                   | unchanged, the flow is not opened twice |
| Sign-in, registration, verification, restart                          | kept                                    |
| Account switch from "Use another account"                             | kept                                    |
| Session ended by the server (`401`)                                   | kept                                    |
| Ordinary sign-out                                                     | cleared                                 |
| Join (`201`), `404 SPACE_INVITE_UNUSABLE`, `409 SPACE_ALREADY_MEMBER` | cleared, only for that token            |
| Not now, Close, or leaving the screen by back                         | cleared                                 |
| Kept seven days                                                       | dropped on the next start               |

The stored invitation is read once at start, and that read can finish
after the user has acted. Every change of intent (a link opened, a join
or terminal answer for the pending token, a decline, an ordinary
sign-out) bumps the slice's `revision`, even with nothing loaded yet;
opening the flow and a join by code do not.
Storage is rewritten on each bump, writes go out one after another, and
a read that finishes under a newer revision is dropped unused. So a
sign-out or a decline made before the stored link loaded keeps it gone,
in memory and in storage, and removing an outlived record never removes
a newer link. An account switch and a `401` do not bump it, so a read
still under way restores the invitation through them.

## Opening the flow

`useInvitationLinks` (`src/navigation/`) reads the launch URL, listens for
URLs while running, and restores the stored invitation. It opens
`AcceptInviteScreen` only in the launch's `ready` phase, so never before
the stored session is read, the user is signed in and the required data
has loaded; a link opened on Welcome or during a failed launch waits for
it. Welcome, Sign In and Sign Up meanwhile say to use the invited email.

## Joining

`AcceptInviteScreen` shows a link's preview (space name, currency,
expiry) and keeps the six-digit code entry a tap away; without a link it
is the code form. Opening a link only previews: the join request goes out
on "Join space" alone, and "Try again" repeats a failed join only when the
join was what failed.

| Answer                                | Shown                                     | Way out                               |
| ------------------------------------- | ----------------------------------------- | ------------------------------------- |
| `201`                                 | —                                         | the space is selected; Home           |
| `409 SPACE_ALREADY_MEMBER` on accept  | — (a repeat, or an older membership)      | the space is selected; Home           |
| `409 SPACE_ALREADY_MEMBER` on preview | already a member                          | Open space                            |
| `403 SPACE_INVITE_EMAIL_MISMATCH`     | sent to another address; no account named | Switch account (keeps the invitation) |
| `404 SPACE_INVITE_UNUSABLE`           | no longer available                       | Close                                 |
| `404` for a code                      | no invitation has the code                | edit the code                         |
| `400 SPACE_MEMBER_LIMIT_REACHED`      | the space is full                         | Try again                             |
| `429`                                 | a countdown from `Retry-After`            | Try again once it ends                |
| No answer                             | check the connection                      | Try again                             |

A join lands on Home through `popTo`, never `goBack`: a screen opened from
an email has nothing of the user's own behind it. A join that outlives
its session selects nothing (`acceptInviteAndSelect`).

A join by code answered late moves the user only if the screen is still
open and no link became the pending invitation since the code was sent
(the slice's `linkRevision`, which an answer or a decline never moves).
So a link opened meanwhile stays on screen and pending, even one opened
again after another (A, B, then A), with an empty code form behind it;
an answer that ended the original link does not hold the user there.
Once the screen is left, the join still selects its space but navigates
nowhere.
