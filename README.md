# success-budget-mobile

A React Native (Expo) personal-finance app: wallets, transactions,
categories, spending limits, shared spaces with one currency each.

## Stack

- Expo SDK 58, React 19, React Native 0.88, TypeScript
- Redux Toolkit for state
- React Navigation (stack + bottom tabs)
- react-hook-form + yup for forms

See [`AGENTS.md`](./AGENTS.md) for the full project layout and conventions.

## Project structure

Screens live under `src/screens/**`; a screen that outgrows a single
file decomposes into `components/` and `hooks/` subfolders. See
["Code organization" in `AGENTS.md`](./AGENTS.md#code-organization)
for the rules behind that split.

## Requirements

- Node.js version pinned in [`.nvmrc`](./.nvmrc) (run `nvm use` if you use nvm)
- npm (comes with Node)
- Expo Go app (or an iOS/Android simulator) to run the client

## Getting started

```sh
npm install
npm start
```

Then follow the Expo CLI prompts to open the app on a simulator, a device
via Expo Go, or in a web browser (`npm run web`).

SDK 58 needs a compatible Expo Go or a newly built native app. The install
script patches the existing Draggable FlatList 4.0.3 to use
`requestIdleCallback` in place of React Native's removed `InteractionManager`.
Recheck that patch when updating the library. TypeScript temporarily uses
React Native's supported legacy API condition to keep this SDK upgrade small;
migrate to the strict API before that compatibility option is removed.

## Scripts

| Script              | Description                       |
| ------------------- | --------------------------------- |
| `npm start`         | Start the Expo dev server         |
| `npm run android`   | Start the dev server for Android  |
| `npm run ios`       | Start the dev server for iOS      |
| `npm run web`       | Start the dev server for web      |
| `npm run lint`      | Lint the project with ESLint      |
| `npm run lint:fix`  | Lint and auto-fix what's fixable  |
| `npm run typecheck` | Type-check the project with `tsc` |
| `npm test`          | Run the test suite with Jest      |

Linting, type-checking and tests also run in CI on every push/PR to `main`
(see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)). A `pre-commit`
hook (Husky + lint-staged) runs ESLint on staged files before each commit.

## Backend

This app talks to a separate backend project. The backend URLs for each
environment live in `API_BASE_URLS` in `src/shared/constants.ts`:

| `EXPO_PUBLIC_API_ENV` | Backend                                            |
| --------------------- | -------------------------------------------------- |
| `local`               | `http://localhost:3000/api/v1`                     |
| `dev`                 | The hosted dev backend (default in development)    |
| `prod`                | Production (default in release builds; no URL yet) |

To switch, copy [`.env.example`](./.env.example) to `.env.local`, set
`EXPO_PUBLIC_API_ENV`, and restart with `npx expo start --clear` (env values
are inlined at bundle time). To point at some other backend, set
`EXPO_PUBLIC_API_BASE_URL` instead -- it wins over `EXPO_PUBLIC_API_ENV`, and
any non-local URL must use `https://` (enforced at startup).

## License

Source available for review only. Copyright (c) 2024-2026 Zakhar Sergan.
All rights reserved: no permission is granted to use, copy, modify or
distribute this code.
