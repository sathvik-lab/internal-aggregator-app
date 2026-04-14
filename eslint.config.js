const expoConfig = require('eslint-config-expo/flat');

const jestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  jest: 'readonly',
};

const nodeGlobals = {
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  console: 'readonly',
  exports: 'writable',
  global: 'readonly',
  module: 'writable',
  process: 'readonly',
  require: 'readonly',
};

module.exports = [
  ...expoConfig,
  {
    ignores: [
      '.expo/**',
      '.claude/**',
      'coverage/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'eslint-report.txt',
    ],
  },
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: jestGlobals,
    },
  },
  {
    files: ['firebase/functions/**/*.js'],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      'import/no-unresolved': 'off',
    },
    languageOptions: {
      globals: nodeGlobals,
    },
  },
];
