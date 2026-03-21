module.exports = {
  extends: ["@emergensee/eslint-config/library.js"],
  parser: "@typescript-eslint/parser",
  ignorePatterns: ["dist/**", ".eslintrc.js", "jest.config.js"],
  parserOptions: {
    project: true,
  },
};
