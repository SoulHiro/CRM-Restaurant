import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/lib/queries.ts"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["**/mock-data/*", "**/mock-data"],
              message:
                "Não importe mock-data diretamente — use a função correspondente em lib/queries.ts.",
            },
          ],
        },
      ],
    },
  },
];
