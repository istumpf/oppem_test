/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: [
    "mocks/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/types/**/*",
    "!src/utils/logger.ts",
    "!src/utils/errors.ts",
    "!src/api/app.ts",
    "!src/index.ts",
    "!src/config.ts",
    "!src/api/middleware/**",
  ],
  coverageDirectory: "coverage/",
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 95,
      statements: 95,
    },
  },
};
