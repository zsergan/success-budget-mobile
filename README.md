# success-budget-mobile

A React Native (Expo) personal-finance app: wallets, transactions,
categories, spending limits, multi-currency support.

## Stack

- Expo SDK 54, React 19, React Native 0.81, TypeScript
- Redux Toolkit for state
- React Navigation (stack + bottom tabs)
- react-hook-form + yup for forms

See [`CLAUDE.md`](./CLAUDE.md) for the full project layout and conventions.

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

Linting and type-checking also run in CI on every push/PR to `main`
(see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)). A `pre-commit`
hook (Husky + lint-staged) runs ESLint on staged files before each commit.

## Backend

This app talks to a separate backend project. Its API base URL is
configured in `src/shared/constants.ts`.
