const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const jestPlugin = require('eslint-plugin-jest');

// Theme guardrails (docs/theming.md): UI colours come from the active theme, never literals or appearance checks.
const COLOR_LITERAL = String.raw`/^(#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(rgb|rgba|hsl|hsla)\(.*|white|black)$/`;
const COLOR_FUNCTION = String.raw`/(rgb|rgba|hsl|hsla)\(|#[0-9a-fA-F]{3,8}/`;
const colorRules = [
  {
    selector: `Literal[value=${COLOR_LITERAL}]`,
    message: 'Use a theme token (createStyles / useTheme().colorTheme) instead of a colour literal.',
  },
  {
    selector: `TemplateElement[value.raw=${COLOR_FUNCTION}]`,
    message: 'Use a theme token (createStyles / useTheme().colorTheme) instead of building a colour.',
  },
];
const appearanceBranch = {
  selector: 'BinaryExpression[operator=/^[!=]==?$/] > Literal[value=/^(light|dark)$/]',
  message: 'Screens take colours from tokens; no light/dark branches.',
};
const fixedThemeImports = {
  paths: [
    {
      name: 'react-native',
      importNames: ['Appearance', 'useColorScheme'],
      message: 'Read the appearance through useTheme().',
    },
    {
      name: '@shared/theme',
      importNames: ['colors', 'colorScheme', 'shadow', 'shadowModal', 'palette'],
      message: 'Take the active theme from useTheme() or a createStyles factory.',
    },
    {
      name: '@shared/constants',
      importNames: ['gradients', 'walletTextColors'],
      message: 'Wallet colours are on useTheme().colorTheme.wallets.',
    },
    {
      name: '@shared/categoryColors',
      importNames: ['getCategoryStroke', 'getCategoryTint'],
      message: 'Category colours are on useTheme().colorTheme.categories.',
    },
  ],
};

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
      // TODO: this codebase relies on the `useRef(...).current` lazy-init idiom (BottomSheetModal,
      // AlertProvider, LongPressedModal) in several places without React Compiler.
      // Downgraded to `warn` pending a dedicated refactor; see .private/REFACTOR_PLAN.md.
      'react-hooks/refs': 'warn',
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/shared/theme.ts', 'src/components/ThemeProvider/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...colorRules],
      'no-restricted-imports': ['error', fixedThemeImports],
    },
  },
  {
    files: ['src/screens/**/*.ts', 'src/screens/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...colorRules, appearanceBranch],
    },
  },
  {
    files: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: jestPlugin.environments.globals.globals,
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
    },
  },
]);
