# CLAUDE.md

Guidance for Claude Code (and any other AI assistant) working in this
repository. All content in this file, and everything committed to this
repo, must stay in English regardless of what language the conversation
with the user happens in.

## Project

`success-budget-mobile` is a React Native (Expo SDK 54, React 19, RN 0.81)
personal-finance app written in TypeScript: wallets, transactions,
categories, spending limits, multi-currency support.

- State: Redux Toolkit. Each domain lives under
  `src/redux/state/<domain>/{initialState,selectors,slice,thunks}.ts`
  (domains: `auth`, `wallet`, `transaction`, `category`, `limit`,
  `currency`, `profile`).
- API layer: `src/api/<resource>.api.ts` wraps a single axios instance
  (`src/api/instance.ts`); request/response shapes are declared in
  `src/api/dto/*.ts` and must match the backend's actual DTOs (see
  "Backend contract" below).
- Navigation: `src/navigation/` (React Navigation stack + bottom tabs).
- Screens: `src/screens/**`, usually paired with a `use<Name>Form.ts` hook
  (react-hook-form + yup) for form logic.
- Reusable UI: `src/components/**`, grouped by concern, typically
  `<Name>.tsx` + `style.ts`.
- Barrel `index.ts` rule (applies to both `screens/**` and `components/**`):
  add one only for a folder that groups more than one thing meant to be
  imported from outside it (e.g. `screens/Auth/` bundles three screens,
  `components/Wallets/` bundles `TinyWallet` + `WalletCard`). A folder
  that is just one component/screen does not get its own `index.ts` — the
  parent barrel (`@screens`, `@components`) imports straight from its file.
  A component used only by its siblings in the same folder (not exported
  further) does not need to be in that folder's barrel either.
- Shared: `src/shared/{constants,enums,theme,types}.ts` and
  `src/shared/utils/`.
- Import aliases: `@<segment>/...` maps to `src/<segment>/...` (see
  `tsconfig.json`). Use the alias form everywhere; do not fall back to deep
  relative imports (`../../..`) for anything under `src/`.
- No test runner is currently wired up. If you add tests, use
  `jest` + `@testing-library/react-native` and add a `test` script to
  `package.json` — don't invent a different toolchain.

## Backend contract

The backend is a separate, actively evolving project. It went through a
recent modernization (global `/api/v1` prefix + versioning, uniform error
shape, whitelist-validated request bodies, ownership checks on
`category_id`, JWT with a real 90-day TTL and revocation on user deletion,
global rate limiting, several field renames on the wallet endpoint). Before
assuming the mobile client's DTOs (`src/api/dto/*.ts`) are correct, check
them against the backend's Swagger (`/docs`, `/docs-json`) or whatever
changelog/spec the user provides — do not assume the existing client code
already matches the current backend.

If a `.private/` directory exists at the repo root, it is gitignored and
never pushed anywhere. It may hold working notes such as a staged
refactor plan — check it for context when present, but never write
anything there that's meant to reach the repository, and never assume it
exists or is up to date without checking.

## Working process — required rules

- **Commit granularity**: one commit = one coherent, reviewable change.
  Don't split a single logical change into multiple tiny commits, and
  don't bundle unrelated changes (e.g. an API-compat fix and an unrelated
  lint cleanup) into one commit. If a task naturally spans several
  concerns, make several commits, each one buildable and each with a
  commit message that accurately describes just that commit's diff.
- **Commit messages**: concise, imperative subject line describing the
  actual change (not "fix stuff" / "updates"); add a short body only when
  the _why_ isn't obvious from the diff. Follow the style of existing
  commit history in this repo.
- **Never commit or push without an explicit, in-the-moment request from
  the user.** Implementing or fixing something is not by itself
  permission to commit it — leave changes in the working tree and say so.
  This holds even if the user approved committing earlier in the same
  session; each commit/push needs its own explicit go-ahead.
- **English only in anything that reaches the repository**: code,
  identifiers, comments, commit messages, PR/MR descriptions, and any
  Markdown docs committed to the repo. Conversation with the user can be
  in whatever language they use.
- **Never put a Claude Code session link (`claude.ai/code/session_...`) in
  anything pushed to this repository** — not in commit messages, PR/MR
  descriptions, code, or docs. This repo may go public; nothing should let
  a reader jump into a private conversation transcript. A plain
  `Co-Authored-By: Claude ...` attribution line without a session URL is
  fine.
- Prefer staged, reviewable changes over large sweeping rewrites — when a
  task is naturally a multi-step refactor, do it in ordered, separately
  committable steps rather than touching everything at once.
