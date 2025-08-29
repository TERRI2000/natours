const globals = require('globals');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: 'req|res|next|val' }],
      'no-const-assign': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
