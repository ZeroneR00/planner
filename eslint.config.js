// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  // Правила из AGENTS.md, которые линтер проверяет сам
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // any — только через eslint-disable-next-line с причиной
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Это не браузер: в React Native нет window.' },
        { name: 'document', message: 'Это не браузер: в React Native нет document.' },
        { name: 'localStorage', message: 'Это не браузер: данные храним в SQLite.' },
        { name: 'sessionStorage', message: 'Это не браузер: данные храним в SQLite.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Цвета — только из src/theme.ts.',
        },
      ],
    },
  },
  {
    files: ['src/theme.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
