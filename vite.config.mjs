import { defineConfig } from "vite"
import pkg from "./package.json"
import fs from "fs"

const GLOBAL_NAME = "Trassel"
const DIST_FOLDER = "dist"
const DOCS_EXAMPLES_FOLDER = "docs/examples"
const LIBRARY_NAME = "trassel"
const VERSION = pkg.version
const AUTHOR = pkg.author
const HOMEPAGE = pkg.homepage
const DESCRIPTION = pkg.description
//This banner is added on top of all exported files
const BANNER = `/** @preserve @license @cc_on
 * ----------------------------------------------------------
 * ${LIBRARY_NAME} version ${VERSION}
 * ${DESCRIPTION}
 * ${HOMEPAGE}
 * Copyright (c) ${new Date().getFullYear()} ${AUTHOR}
 * All Rights Reserved.
 * https://mit-license.org/
 * ----------------------------------------------------------
 */
`
export default defineConfig({
	build: {
		target: "modules",
		outDir: `./${DIST_FOLDER}`,
		emptyOutDir: false,
		minify: "terser",
		lib: {
			entry: "./src/index.js",
			formats: ["es", "umd"],
			name: GLOBAL_NAME,
			fileName: format => {
				return format === "umd" ? "umd-bundle.js" : "esm-bundle.js"
			}
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true
			}
		}
	},
	plugins: [
		{
			//Vite does not put the banner specified in rollupConfig at the very top of the file, but instead, for example, inside of the UMD module for some reason
			//This plugin adds the banner at the very top when writing the bundle to disk, guaranteeing its always in the right place.
			name: "add-banner",
			apply: "build",
			async writeBundle(_, bundle) {
				for (const fileName of Object.entries(bundle)) {
					const file = fileName[0]
					if (_.dir.endsWith(DIST_FOLDER) && file.match(/\.(css|js)$/i)) {
						const fileURL = `${DIST_FOLDER}/${file}`
						let data = fs.readFileSync(fileURL, { encoding: "utf8" })
						data = `${BANNER} ${data}`
						fs.writeFileSync(fileURL, data)
						fs.writeFileSync(`${DOCS_EXAMPLES_FOLDER}/${file}`, data)
					}
				}
				const examples = ["examplehierarchy.html", "exampleanimatestate.html", "examplerenderer.html"]
				examples.forEach(file => {
					fs.copyFileSync(`${DOCS_EXAMPLES_FOLDER}/${file}`, `${DIST_FOLDER}/${file}`)
				})
			}
		}
	]
})
