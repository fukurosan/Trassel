/**
 * Computes the radian of an angle.
 * @param {number} angle
 */
export const computeRadian = angle => {
	angle = angle % 360
	if (angle < 0) {
		angle = angle + 360
	}
	let arc = (2 * Math.PI * angle) / 360
	if (arc < 0) {
		arc = arc + 2 * Math.PI
	}
	return arc
}
