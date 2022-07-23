import { deepCopyObject } from "./jsonutility"

describe("JSON utilities", () => {
	const data = {
		str: "1",
		level2: [
			{
				str: "2"
			},
			{
				str: "3",
				level3: [
					{
						num: 1
					},
					{
						num: 2
					}
				]
			}
		]
	}

	it("Deep copy works", () => {
		const clone = deepCopyObject(data)
		const dataString = JSON.stringify(data)
		const cloneString = JSON.stringify(clone)
		expect(clone === data).toBe(false)
		expect(cloneString === dataString).toBe(true)
	})
})
