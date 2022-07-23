import { computeRadian } from "./mathutils"

describe("Math utilities", () => {
	it("Computes radians", () => {
		expect(computeRadian(0)).toEqual(0)
		expect(computeRadian(90)).toEqual(1.5707963267948966)
		expect(computeRadian(180)).toEqual(3.141592653589793)
		expect(computeRadian(270)).toEqual(4.71238898038469)
		expect(computeRadian(359)).toEqual(6.265732014659642)
		expect(computeRadian(360)).toEqual(0)
	})
})
