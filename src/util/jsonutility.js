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
	} else if (typeof o === "object" && Object.keys(o).length > 0) {
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

/**
 * Applies a template object to another object. Any properties in the template that are not set in the object will be set (recursively).
 * Arrays will be considered as basic values, and no merging or anything like that is done.
 * NOTE: The input object will be mutated!
 * @param {{[key: string]: any}} obj
 * @param {{[key: string]: any}} template
 * @returns
 */
export const applyTemplateToObject = (obj, template) => {
	Object.keys(template).forEach(key => {
		const objValue = obj[key]
		const templValue = template[key]
		//If both are objects then apply them recursively
		if (
			typeof objValue === "object" &&
			typeof templValue === "object" &&
			objValue !== null &&
			templValue !== null &&
			!Array.isArray(objValue) &&
			!Array.isArray(templValue)
		) {
			applyTemplateToObject(objValue, templValue)
		}
		//If there is already a value (even null!) then do not change it
		else if (objValue !== undefined) {
			return 0
		}
		//If the template value is an array then deep-copy it and apply it
		else if (templValue instanceof Array) {
			obj[key] = deepCopyObject(templValue)
		}
		//If the template value is an object then deep-copy it and apply it
		else if (typeof templValue === "object" && templValue !== null) {
			obj[key] = deepCopyObject(templValue)
		}
		//Otherwise just set the value
		else {
			obj[key] = templValue
		}
	})
	return obj
}
