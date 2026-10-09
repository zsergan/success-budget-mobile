module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@(api|components|hooks|navigation|redux|screens|shared)/(.*)$': '<rootDir>/src/$1/$2',
    // The bare form (e.g. `@components`, importing a barrel's index.ts
    // directly) isn't covered by the pattern above, which requires a
    // sub-path after the segment.
    '^@(api|components|hooks|navigation|redux|screens|shared)$': '<rootDir>/src/$1',
    // react-redux's package.json "react-native" field points at its ESM
    // build, which jest-expo's RN-style resolution picks up and then fails
    // to parse (no test here goes through Metro) -- force the CJS dev
    // build instead, same as any other node_modules package under test.
    '^react-redux$': '<rootDir>/node_modules/react-redux/dist/cjs/react-redux.development.cjs',
  },
  // jest-expo's own transformIgnorePatterns (its allowlist of node_modules
  // packages that need Babel transforming) does not include `immer`, which
  // @reduxjs/toolkit ships as an ESM-only build -- add it to the same list,
  // along with react-native-gifted-charts' ESM-only core package.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|immer|gifted-charts-core))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
};
