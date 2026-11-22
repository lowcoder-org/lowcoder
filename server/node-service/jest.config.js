/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 10 * 60000,
  testPathIgnorePatterns: ["/node_modules/", "/build/"],
  setupFiles: ["./jest.setup.ts"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageReporters: ["text-summary", "json-summary", "lcov"],
  coveragePathIgnorePatterns: ["/node_modules/", "\\.d\\.ts$", "/i18n/(en|zh)\\.ts$", "/api/apiResponse\\.ts$"],
  coverageThreshold: { global: { lines: 85, branches: 85 } },
};
