import pkg from "./package.json"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import { terser } from "rollup-plugin-terser"
import copy from "rollup-plugin-copy"

const GLOBAL_NAME = "Trassel"
const DIST_FOLDER = "dist"
const LIBRARY_NAME = pkg.name
const VERSION = pkg.version
const AUTHOR = pkg.author
const HOMEPAGE = pkg.homepage
const DESCRIPTION = pkg.description
const BANNER = `/** @preserve @license @cc_on
 * ----------------------------------------------------------
 * ${LIBRARY_NAME} version ${VERSION}
 * ${DESCRIPTION}
 * ${HOMEPAGE}
 * Copyright (c) ${new Date().getFullYear()} ${AUTHOR}
 * All Rights Reserved. MIT License
 * https://mit-license.org/
 * ----------------------------------------------------------
 */\n`

//https://github.com/pixijs/pixijs/issues/7513
//https://github.com/bigtimebuddy/pixi-rollup-example/blob/main/rollup.config.js

export default [
	{
		input: "./src/index.js",
		output: [
			{
				file: `${DIST_FOLDER}/${LIBRARY_NAME.toLowerCase()}.esm.js`,
				format: "esm",
				banner: BANNER
			},
			{
				file: `${DIST_FOLDER}/${LIBRARY_NAME.toLowerCase()}.umd.js`,
				format: "umd",
				banner: BANNER,
				name: GLOBAL_NAME
			},
			{
				file: `${DIST_FOLDER}/${LIBRARY_NAME.toLowerCase()}.iife.js`,
				format: "iife",
				banner: BANNER,
				name: GLOBAL_NAME
			},
			{
				file: `${DIST_FOLDER}/${LIBRARY_NAME.toLowerCase()}.cjs.js`,
				format: "cjs",
				banner: BANNER,
				name: GLOBAL_NAME
			},
			{
				file: `./docs/examples/${LIBRARY_NAME.toLowerCase()}.iife.js`,
				format: "iife",
				banner: BANNER,
				name: GLOBAL_NAME
			}
		],
		plugins: [
			resolve({
				extensions: [".js"],
				preferBuiltins: false
			}),
			commonjs(),
			copy({
				targets: [
					{ src: "./docs/examples/example.html", dest: "./dist" },
					{ src: "./docs/examples/examplehierarchy.html", dest: "./dist" },
					{ src: "./docs/examples/exampleanimatestate.html", dest: "./dist" },
					{ src: "./docs/examples/examplerenderer.html", dest: "./dist" }
				]
			})
		]
	},
	{
		input: "./src/index.js",
		output: [
			{
				file: `${DIST_FOLDER}/${LIBRARY_NAME.toLowerCase()}.esm.min.js`,
				format: "esm",
				banner: BANNER
			},
			{
				file: `${DIST_FOLDER}/${LIBRARY_NAME.toLowerCase()}.umd.min.js`,
				format: "umd",
				banner: BANNER,
				name: GLOBAL_NAME
			},
			{
				file: `${DIST_FOLDER}/${LIBRARY_NAME.toLowerCase()}.cjs.min.js`,
				format: "cjs",
				banner: BANNER,
				name: GLOBAL_NAME
			},
			{
				file: `${DIST_FOLDER}/${LIBRARY_NAME.toLowerCase()}.iife.min.js`,
				format: "iife",
				banner: BANNER,
				name: GLOBAL_NAME
			}
		],
		plugins: [
			resolve({
				extensions: [".js"],
				preferBuiltins: false
			}),
			commonjs(),
			terser({
				format: {
					comments(node, comment) {
						const text = comment.value
						const type = comment.type
						if (type == "comment2") {
							return /@preserve|@license|@cc_on/i.test(text)
						}
					}
				}
			})
		]
	}
]
