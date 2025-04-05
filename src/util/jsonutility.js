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
 * Applies a template object to another object. Properties in the template will be set recursively in the object.
 * Arrays will be considered as basic values, and no merging or anything like that is done.
 * NOTE: The input object will be mutated!
 * @param {{[key: string]: any}} obj - Object for template to be applied to
 * @param {{[key: string]: any}} template - template to apply
 * @param {boolean=} overwriteOriginal - If there is already a value in the original, should it be overwritten by the template?
 * @returns
 */
export const applyTemplateToObject = (obj, template, overwriteOriginal = true) => {
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
			applyTemplateToObject(objValue, templValue, overwriteOriginal)
		}
		//If there is already a value (even null!) then do not change it
		else if (objValue !== undefined && !overwriteOriginal) {
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
