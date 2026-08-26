import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/tests/unit/application/use-cases/**/*.test.ts",
    "<rootDir>/tests/unit/interface-adapters/**/*.test.ts",
    "<rootDir>/tests/unit/proxy.test.ts",
  ],
  coverageProvider: "v8",
  coverageDirectory: "<rootDir>/tests/coverage",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

async function resolvedJestConfig() {
  const resolvedConfig = await createJestConfig(config)();
  return {
    ...resolvedConfig,
    transformIgnorePatterns: ["/node_modules/(?!jose)/"],
  };
}

export default resolvedJestConfig;
