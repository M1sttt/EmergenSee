module.exports = {
  extends: ['@emergensee/eslint-config/react.js'],
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['dist/**', 'postcss.config.js', 'tailwind.config.js', 'vite.config.ts', 'playwright.config.ts', 'e2e/**'],
  parserOptions: {
    project: true,
  },
};
