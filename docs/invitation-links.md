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

## Opening the flow

`useInvitationLinks` (`src/navigation/`) reads the launch URL, listens for
URLs while running, and restores the stored invitation. It opens
`InvitationScreen` only in the launch's `ready` phase, so never before the
stored session is read, the user is signed in and the required data has
loaded; a link opened on Welcome or during a failed launch waits for it.
The screen previews the invitation and joins only on "Join".
