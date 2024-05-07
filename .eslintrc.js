module.exports = {
    root: true,
    parser: '@babel/eslint-parser',
    plugins: [
        '@typescript-eslint',
        'prettier',
        'jest',
    ],
    extends: [
        '@react-native-community',
        'prettier',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    rules: {
        'react/react-in-jsx-scope': 'off', // add this line
    },
    ignorePatterns: ['.eslintrc.js'],
};
