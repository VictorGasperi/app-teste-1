import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true } },
      "boundaries/include": ["src/**", "app/**", "di/**"],
      "boundaries/elements": [
        { type: "web", pattern: "app/**", partialMatch: false },
        { type: "controllers", pattern: "src/interface-adapters/controllers/**", partialMatch: false },
        { type: "use-cases", pattern: "src/application/use-cases/**", partialMatch: false },
        { type: "service-interfaces", pattern: "src/application/services/**", partialMatch: false },
        { type: "repository-interfaces", pattern: "src/application/repositories/**", partialMatch: false },
        { type: "entities", pattern: "src/entities/**", partialMatch: false },
        { type: "env", pattern: "src/env/**", partialMatch: false },
        // `adapters` must come BEFORE `infrastructure` — first match wins
        { type: "adapters", pattern: "src/infrastructure/adapters/**", partialMatch: false },
        { type: "infrastructure", pattern: "src/infrastructure/**", partialMatch: false },
        { type: "di", pattern: "di/**", partialMatch: false },
      ],
    },
    rules: {
      "boundaries/no-unknown-dependencies": "error",
      "boundaries/no-unknown-files": "error",
      "boundaries/dependencies": ["error", {
        default: "disallow",
        policies: [
          { from: { element: { type: "web" } },
            allow: { to: { element: { types: { anyOf: ["web", "entities", "di"] } } } } },

          { from: { element: { type: "controllers" } },
            allow: { to: { element: { types: { anyOf: ["entities", "service-interfaces", "repository-interfaces", "use-cases"] } } } } },

          { from: { element: { type: "use-cases" } },
            allow: { to: { element: { types: { anyOf: ["entities", "service-interfaces", "repository-interfaces"] } } } } },

          { from: { element: { type: "service-interfaces" } },
            allow: { to: { element: { types: { anyOf: ["entities"] } } } } },

          { from: { element: { type: "repository-interfaces" } },
            allow: { to: { element: { types: { anyOf: ["entities"] } } } } },

          { from: { element: { type: "entities" } },
            allow: { to: { element: { types: { anyOf: ["entities"] } } } } },

          // `env` is the ONLY element that may read process.env — nothing above it may import it
          { from: { element: { type: "env" } },
            allow: { to: { element: { types: { anyOf: ["entities"] } } } } },

          { from: { element: { type: "infrastructure" } },
            allow: { to: { element: { types: { anyOf: ["entities", "env", "service-interfaces", "repository-interfaces"] } } } } },

          // inter-module adapters may reach the supplier's use case
          { from: { element: { type: "adapters" } },
            allow: { to: { element: { types: { anyOf: ["entities", "env", "service-interfaces", "repository-interfaces", "use-cases"] } } } } },

          { from: { element: { type: "di" } },
            allow: { to: { element: { types: { anyOf: ["di", "controllers", "use-cases", "service-interfaces", "repository-interfaces", "infrastructure", "adapters", "env"] } } } } },
        ],
      }],
    },
  },
]);

export default eslintConfig;
