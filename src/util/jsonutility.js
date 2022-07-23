export const deepCopyObject = o => {
	if (o === null) {
		return o
	} else if (o instanceof Array) {
		const out = []
		for (const key in o) {
			const v = o[key]
			out[key] = typeof v === "object" && v !== null ? deepCopyObject(v) : v
		}
		return out
	} else if (typeof o === "object" && o !== {}) {
		const out = {}
		for (const key in o) {
			const v = o[key]
			out[key] = typeof v === "object" && v !== null ? deepCopyObject(v) : v
		}
		return out
	} else if (o instanceof Date) {
		return new Date(o.getTime())
	} else {
		return o
	}
}
