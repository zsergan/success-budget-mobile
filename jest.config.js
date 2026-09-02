module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@(api|components|hooks|navigation|redux|screens|shared)/(.*)$': '<rootDir>/src/$1/$2',
  },
  // jest-expo's own transformIgnorePatterns (its allowlist of node_modules
  // packages that need Babel transforming) does not include `immer`, which
  // @reduxjs/toolkit ships as an ESM-only build -- add it to the same list.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|immer))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
};
