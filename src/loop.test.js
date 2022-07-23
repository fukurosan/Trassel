import Loop from "./loop"

describe("Looper", () => {
	it("Update caps works", async () => {
		let updateCount = 0
		const loopFn = () => updateCount++
		const start = Date.now()
		const loop = new Loop(loopFn, 60)
		loop.start()
		await new Promise(resolve => setTimeout(resolve, 2000))
		loop.stop()
		const updatesPerSecond = updateCount / ((Date.now() - start) / 1000)
		expect(updatesPerSecond).toBeGreaterThan(59)
		expect(updatesPerSecond).toBeLessThanOrEqual(60)
	})

	it("Starting and stopping works", async () => {
		let updateCount = 0
		const loopFn = () => updateCount++
		const loop = new Loop(loopFn)
		loop.start()
		await new Promise(resolve => setTimeout(resolve, 200))
		loop.stop()
		const recordedValue = updateCount
		await new Promise(resolve => setTimeout(resolve, 200))
		expect(recordedValue).toEqual(updateCount)
	})
})
