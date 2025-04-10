import LayoutComponent from "./layoutcomponent"

/**
 * Uses the average of all node positions to create a center force that stops nodes from floating away
 */
export default class Center extends LayoutComponent {
	/**
	 * @param {Object} options - Options for the object
	 * @param {number=} options.x - x coordinate for the component
	 * @param {number=} options.y - y coordinate for the component
	 * @param {number=} options.strength - Strength of the force
	 */
	constructor({ x = 0, y = 0, strength = 1 } = {}) {
		super()
		this.x = x
		this.y = y
		this.strength = strength
	}

	initialize(...args) {
		super.initialize(...args)
	}

	execute() {
		let allX = 0
		let allY = 0
		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i]
			allX += node.x
			allY += node.y
		}
		const xAdjustment = (allX / this.nodes.length - this.x) * this.strength
		const yAdjustment = (allY / this.nodes.length - this.y) * this.strength
		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i]
			node.x -= xAdjustment
			node.y -= yAdjustment
		}
	}
}
