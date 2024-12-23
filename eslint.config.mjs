// import js from "@eslint/js";
// import tsPlugin from "@typescript-eslint/eslint-plugin";
// import tsParser from "@typescript-eslint/parser";
// import n8nNodesBase from "eslint-plugin-n8n-nodes-base";

// /**
//  * @type {import('eslint').ESLint.ConfigData}
//  */
// export default {
//   root: true,

//   env: {
//     browser: true,
//     es6: true,
//     node: true,
//   },

//   parser: "@typescript-eslint/parser",

//   parserOptions: {
//     project: ["./tsconfig.json"],
//     sourceType: "module",
//     extraFileExtensions: [".json"],
//   },

//   ignorePatterns: [
//     ".eslintrc.js",
//     "**/*.js",
//     "**/node_modules/**",
//     "**/dist/**",
//   ],

//   overrides: [
//     {
//       files: ["package.json"],
//       plugins: ["eslint-plugin-n8n-nodes-base"],
//       extends: ["plugin:n8n-nodes-base/community"],
//       rules: {
//         "n8n-nodes-base/community-package-json-name-still-default": "off",
//       },
//     },
//     {
//       files: ["./credentials/**/*.ts"],
//       plugins: ["eslint-plugin-n8n-nodes-base"],
//       rules: {
//         "n8n-nodes-base/cred-class-field-documentation-url-missing": "off",
//         "n8n-nodes-base/cred-class-field-documentation-url-miscased": "off",
//         "n8n-nodes-base/cred-filename-against-convention": "off",
//       },
//     },
//     {
//       files: ["./nodes/**/*.ts"],
//       plugins: ["eslint-plugin-n8n-nodes-base"],
//       extends: ["plugin:n8n-nodes-base/nodes"],
//       rules: {
//         "n8n-nodes-base/node-execute-block-missing-continue-on-fail": "off",
//         "n8n-nodes-base/node-resource-description-filename-against-convention": "off",
//         "n8n-nodes-base/node-param-fixed-collection-type-unsorted-items": "off",
//       },
//     },
//   ],
// };

import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import n8nNodesBase from "eslint-plugin-n8n-nodes-base";

export default [
  {
    // Global settings for all files
    files: ["**/*.ts", "**/*.json", "package.json"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        extraFileExtensions: [".json"],
      },
    },
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
    ],
    plugins: {
      "@typescript-eslint": tsPlugin,
      "n8n-nodes-base": n8nNodesBase,
    },
    rules: {
      // Add base rules or overrides here
    },
  },
  {
    // Configuration specifically for package.json
    files: ["package.json"],
    rules: {
      // Add rules specific to package.json here
      "n8n-nodes-base/community-package-json-name-still-default": "off",
    },
  },
  {
    // Configuration specifically for credential files
    files: ["credentials/**/*.ts"],
    rules: {
      "n8n-nodes-base/cred-class-field-documentation-url-missing": "off",
      "n8n-nodes-base/cred-class-field-documentation-url-miscased": "off",
      "n8n-nodes-base/cred-filename-against-convention": "off",
    },
  },
  {
    // Configuration specifically for node files
    files: ["nodes/**/*.ts"],
    rules: {
      "n8n-nodes-base/node-execute-block-missing-continue-on-fail": "off",
      "n8n-nodes-base/node-resource-description-filename-against-convention": "off",
      "n8n-nodes-base/node-param-fixed-collection-type-unsorted-items": "off",
    },
  },
];
