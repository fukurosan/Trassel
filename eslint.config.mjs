import eslintConfigPrettier from "eslint-config-prettier"
import globals from "globals"
import js from "@eslint/js"

export default [
	{
		ignores: ["**/dist", "**/node_modules", "**/docs"]
	},
	js.configs.recommended,
	eslintConfigPrettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			},
			ecmaVersion: 2022,
			sourceType: "module"
		},
		rules: {
			"no-console": [2, { allow: ["warn", "error", "time", "timeEnd"] }],
			indent: [2, "tab", { SwitchCase: 1 }],
			"linebreak-style": [2, "unix"],
			quotes: [2, "double"],
			semi: [2, "never"],
			"keyword-spacing": [2, { before: true, after: true }],
			"no-unused-vars": 2,
			"space-before-blocks": [2, "always"],
			"no-mixed-spaces-and-tabs": [2, "smart-tabs"],
			"no-cond-assign": 2,
			"object-shorthand": [2, "always"],
			"no-const-assign": 2,
			"no-class-assign": 2,
			"no-this-before-super": 2,
			"no-var": 2,
			"no-unreachable": 2,
			"valid-typeof": 2,
			"quote-props": [2, "as-needed"],
			"one-var": [2, "never"],
			"prefer-arrow-callback": 2,
			"prefer-const": [2, { destructuring: "all" }],
			"arrow-spacing": 2,
			curly: [2, "multi-line"],
			"max-lines": [2, { max: 1200, skipComments: true, skipBlankLines: true }],
			"arrow-parens": [2, "as-needed"],
			"object-curly-spacing": [2, "always", { arraysInObjects: false }],
			"lines-between-class-members": [2, "always", { exceptAfterSingleLine: true }],
			"no-constant-condition": [0]
		}
	}
]
