# AGENTS.md

Project instructions for AI coding agents (Claude Code, Codex and others).
Everything committed to this repo stays in English, whatever language the
conversation is in.

## Project

`success-budget-mobile`: a React Native personal-finance app (Expo SDK 58,
React 19, RN 0.88, TypeScript strict) with wallets, transactions,
categories, spending limits and shared spaces with members. Each space has
one currency (picked at sign-up for the personal space, or when a space is
created); wallets and transactions use it, and nothing converts between
currencies. Redux Toolkit + RTK Query, React Navigation, react-hook-form + yup.

## Commands

- While implementing, run the checks relevant to what you touched (e.g.
  the affected test files, `npm run typecheck`).
- Before calling the whole task finished, run `npm run typecheck`,
  `npm run lint` and `npm test`; CI runs the same on every push/PR to
  `main`.
- `npm run lint:fix` for auto-fixable lint and Prettier issues.
- `npm start` (or `ios`/`android`/`web`) to run the app; backend
  environment setup is in `README.md`.
- The pre-commit hook (Husky + lint-staged) only lints staged files; it
  does not typecheck or test.

## Architecture

- **Server data is RTK Query only.** One `createApi` in
  `src/redux/api/baseApi.ts`; each domain injects endpoints from
  `src/redux/state/<domain>/api.ts`, and derived values are pure functions
  or cache selectors in that domain's `selectors.ts`. Tags and
  invalidation rules: `docs/server-data.md`.
- **Slices hold client state only**: `auth` (session, `sessionKey`),
  `space` (selected space), `member` (invite cooldown), `transactionFlow`
  (the open transaction sheet; ends on logout or space switch),
  `pendingWrite` (transaction writes persisted per user before sending,
  until their outcome is known; see `transaction/operations.ts`),
  `passwordReset` (the recovery flow's address, resend cooldown and
  in-memory reset authorization, apart from registration's `userEmail`;
  see `docs/password-recovery.md`) and `launch` (fonts + stored
  session → Welcome or the app; see `docs/launch.md`). Do not add server
  data to a slice.
- Selecting a space after create/accept/leave goes through
  `space/thunks.ts`, which checks the session is still current.
- Space-scoped endpoints take `spaceId` in their argument; get it from
  `useSpaceArg()` (`src/redux/hooks`), which gives `skipToken` when no
  space is active.
- Views read `currentData` (never `data`), so a changed argument never
  shows another space's or period's data. Loading/error states come from
  `getLoadState` (`src/redux/api/loadState.ts`), so a background refetch,
  failed or not, keeps the last result on screen.
- Periods are ISO strings; build a transactions period with `periodArg`
  so equal periods share one cache entry.
- Mutations invalidate only on success (exceptions are documented in
  `docs/server-data.md`).

## API layer

- `src/api/instance.ts` builds the shared axios client (auth header, 401
  and 429 handling), used by RTK Query's base query and by sign-in/up in
  `src/api/auth.api.ts`.
- `src/api/errors.ts` turns any failed request into an `ErrorResponse`,
  its status taken from the response whatever the body.
- Request/response shapes live in `src/api/dto/*.ts`; DTO-to-model
  mapping in `src/api/models/`.

## Backend contract

The backend is a separate, actively evolving project. Do not assume the
DTOs in `src/api/dto/` match it: check them against the backend's Swagger
(`/docs`, `/docs-json`) or the spec/changelog the user provides before
relying on or changing them.

## Code organization

- Screens: `src/screens/**`; navigation: `src/navigation/`; shared UI:
  `src/components/**` (`<Name>.tsx` + `style.ts`); shared hooks:
  `src/hooks/`; shared constants/types/utils: `src/shared/`.
- **Local by default.** A component, hook or function stays inside its
  screen until a second screen needs it; only then does it move to
  `src/components/`, `src/hooks/` or `src/shared/`. App-specific pieces
  qualify too (e.g. `TransactionFlow`), they need not be generic.
- A screen that outgrows one file splits into
  `<Screen>/components/<Name>/{<Name>.tsx,style.ts}` and
  `<Screen>/hooks/use<Name>.ts`. Create these folders only when needed;
  a hook used by one section lives in that section's folder. A simple
  form screen with one `use<Name>Form.ts` (react-hook-form + yup) needs
  no further split.
- **The screen owns composition**: navigation, section layout and passing
  values between sibling sections happen in `<Screen>Screen.tsx`;
  sections stay ignorant of their siblings.
- **Split hooks by meaning, not by screen** (e.g. `usePeriod` +
  `useTransactionsData`, not one `useTransactionsScreen`).
- **Barrels**: add an `index.ts` only to a folder grouping more than one
  thing imported from outside it (e.g. `screens/Auth/`,
  `components/Wallets/`). A single-component folder gets none; the parent
  barrel (`@screens`, `@components`) imports its file directly.
- **Imports**: always use the `@<segment>/...` alias for anything under
  `src/` (maps to `src/<segment>/...`); no deep `../../..` paths.
- **Theme**: colours and shadows come from the active theme. A `style.ts`
  exports `createStyles(theme: ColorTheme)`, read with
  `useThemedStyles(createStyles)`; colours outside a stylesheet (icons,
  spinners, gradients) come from `useTheme().colorTheme`. Fonts, sizes and
  spacing stay on the static default `theme` export. No light/dark branches:
  a new role is a token in `src/shared/theme.ts`. Details: `docs/theming.md`.
- Known layout pitfalls (Plus Jakarta Sans clipping, nested safe areas):
  `docs/ui-pitfalls.md`.
- Bottom sheets and confirmations (presence, keyboard, stacking, stale
  confirmations): `docs/sheets.md`.

## Tests

- Jest + `jest-expo` + `@testing-library/react-native`.
- Co-locate tests next to the code (`*.test.ts` / `*.test.tsx`).
- Test pure transforms directly when it is cheap to do so.

## Code style

- Prettier + ESLint enforce formatting and type-only imports; let the
  tooling decide formatting.
- **Comments: default to none.** Comment only a non-obvious why (hidden
  constraint, workaround, surprising behavior), never what the code
  says. One line, two at most; longer reasoning belongs in the commit
  message or PR description.

## Git workflow

- Commit only when the current task or an approved implementation plan
  authorizes it; within that work, make logical commits without asking
  again for each one. Authorization from an earlier task does not carry
  over. Otherwise leave changes in the working tree and say so.
- **Never push or create a PR without explicit approval**, even when
  commits were authorized.
- PR descriptions follow `.github/pull_request_template.md`; fill in
  "Mobile API changes" (or leave "None").
- One commit = one coherent, reviewable, buildable change. Don't split one
  logical change into tiny commits or bundle unrelated ones.
- Commit messages follow the history: `type(scope): imperative subject`
  (e.g. `fix(sign-up): ...`, `refactor(hooks): ...`); add a short body
  only when the why isn't obvious from the diff.
- Branches: `<type>/<scope>-<change>[-<extra>]`, e.g.
  `feat/spaces-foundation`, `fix/spaces-backend-compat`. No stage
  numbering (`stage1`).
- Prefer ordered, separately committable steps over sweeping rewrites.
- **Never put a Claude Code session link (`claude.ai/code/session_...`) or
  any other private transcript link** in commits, PR descriptions, code or
  docs; this repo may go public. A plain `Co-Authored-By:` line is fine.

## Private notes

`.private/` (gitignored, never pushed) may hold working notes such as a
refactor plan. Check it for context when present, but don't assume it
exists or is current, and never put anything meant for the repo there.

## Maintaining this file

- Keep this file concise and project-specific.
- Before adding instructions, check whether an existing rule can be
  updated instead.
- Avoid duplicates, obsolete rules, and information that can be easily
  discovered from the codebase.
- Prefer Skills for reusable workflows and separate documentation (`docs/`)
  for detailed references.
- Keep this file under 200 lines when practical. `CLAUDE.md` only imports
  it (`@AGENTS.md`); edit this file, not that one.
