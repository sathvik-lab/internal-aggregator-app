const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      '.expo/**',
      'coverage/**',
      'node_modules/**',
      'dist/**',
      'build/**',
    ],
  },
]);
