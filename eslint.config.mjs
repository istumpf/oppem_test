import typescriptEslint from "@typescript-eslint/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  {
    plugins: {
      typescriptEslint,
    },
    rules: {},
  },
  eslintConfigPrettier,
];
