import lcg from "./lcg"

describe("LCG", () => {
	it("Computes random numbers predictably", () => {
		const random1 = lcg()
		const random2 = lcg()
		for (let i = 0; i < 10; i++) {
			expect(random1()).toEqual(random2())
		}
	})

	it("Computes random numbers between 0 and 1", () => {
		const random = lcg()
		for (let i = 0; i < 10; i++) {
			const number = random()
			expect(number).toBeLessThanOrEqual(1)
			expect(number).toBeGreaterThanOrEqual(0)
		}
	})
})
