import { describe, expect, it } from "vitest"
import { deepCopyObject, applyTemplateToObject } from "./jsonutility"

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

	it("Applying template to objects works", () => {
		const baseObject = JSON.stringify({
			id: 1,
			name: "Gerald",
			settings: {
				a: 1,
				c: 2
			}
		})
		const template = {
			name: "N/A",
			icon: "icon-url",
			settings: {
				a: 3,
				b: 4,
				c: 5
			}
		}
		const expectedResultOverwriteOriginal = {
			id: 1,
			name: "N/A",
			settings: {
				a: 3,
				c: 5,
				b: 4
			},
			icon: "icon-url"
		}
		const expectedResultRespectOriginal = {
			id: 1,
			name: "Gerald",
			settings: {
				a: 1,
				c: 2,
				b: 4
			},
			icon: "icon-url"
		}
		expect(JSON.stringify(applyTemplateToObject(JSON.parse(baseObject), template))).toStrictEqual(JSON.stringify(expectedResultOverwriteOriginal))
		expect(JSON.stringify(applyTemplateToObject(JSON.parse(baseObject), template, false))).toStrictEqual(JSON.stringify(expectedResultRespectOriginal))
	})
})
