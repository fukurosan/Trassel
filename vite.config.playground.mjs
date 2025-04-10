import { defineConfig } from "vite"

const DIST_FOLDER = "docs"

export default defineConfig({
	base: "./",
	build: {
		target: "modules",
		outDir: `./${DIST_FOLDER}/playground`,
		emptyOutDir: true,
		minify: "terser",
		rollupOptions: {
			output: {
				inlineDynamicImports: true
			}
		}
	}
})
