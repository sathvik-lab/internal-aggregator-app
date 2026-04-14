const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      '.expo/**',
      'coverage/**',
      'node_modules/**',
      'dist/**',
      'build/**',
    ],
  },
];
