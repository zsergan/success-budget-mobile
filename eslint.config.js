const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const jestPlugin = require('eslint-plugin-jest');

module.exports = defineConfig([
  {
    ignores: ['dist/*', 'web-build/*', '.expo/*'],
  },
  expoConfig,
  prettierRecommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'all', ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
      // TODO: this codebase relies on the `useRef(...).current` lazy-init idiom (LoadingScreen,
      // BottomSheetModal, AlertProvider, LongPressedModal) in several places without React Compiler.
      // Downgraded to `warn` pending a dedicated refactor; see .private/REFACTOR_PLAN.md.
      'react-hooks/refs': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: jestPlugin.environments.globals.globals,
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
    },
  },
]);
