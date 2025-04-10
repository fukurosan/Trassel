import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		setupFiles: "./test/helpers/setup.js",
		testTimeout: 10000,
		resolveSnapshotPath: (testPath, snapExtention) => {
			const fileName = testPath.split("/").pop()
			return `test/snapshots/${fileName}${snapExtention}`
		}
	}
})
