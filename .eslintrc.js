module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  plugins: ['@typescript-eslint', 'prettier', 'jest'],
  extends: [
    '@react-native-community',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'all',
            ignoreRestSiblings: true,
            argsIgnorePattern: '^_',
          },
        ],
      },
    },
  ],
  ignorePatterns: ['.eslintrc.js'],
};
