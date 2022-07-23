import LayoutComponent from "./layoutcomponent.js"

/**
 * Creates a radial component that pulls nodes into a circular pattern
 * @param {number=} strength - How strong should it be? (0-1)
 * @param {number=} centerX - Center X coordinate of the component
 * @param {number=} centerY - Center Y coordinate of the component
 * @param {number=} diameter - Diameter of the circle
 * @param {number=} sizeMultiplier - If diameter is automatically computed based on nodes, how much extra space should be added? (Multiplier)
 */
export default class Radial extends LayoutComponent {
	constructor(strength = 0.9, centerX = null, centerY = null, sizeMultiplier = 1.2, diameter = null) {
		super()
		this.strength = strength
		this.centerX = centerX
		this.centerY = centerY
		this.sizeMultiplier = sizeMultiplier
		this.userProvidedDiameter = diameter
		this.diameter = 0
	}

	initialize(...args) {
		super.initialize(...args)
		this.diameter = this.userProvidedDiameter
			? this.userProvidedDiameter
			: (this.nodes.reduce((acc, node) => acc + node.radius * 2, 0) / 3.14) * this.sizeMultiplier
		//Center will only be determined on the first initialization
		const averageCoordinates = this.getAverageCoordinates()
		this.centerX === null && (this.centerX = averageCoordinates[0])
		this.centerY === null && (this.centerY = averageCoordinates[1])
	}

	execute(alpha) {
		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i]
			const distanceX = node.x - this.centerX || 1e-6
			const distanceY = node.y - this.centerY || 1e-6
			const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
			const force = ((this.diameter - distance) * this.strength * alpha) / distance
			node.vx += distanceX * force
			node.vy += distanceY * force
		}
	}
}
