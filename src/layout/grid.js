import LayoutComponent from "./layoutcomponent"

/**
 * Grid layout creates a grid on either the Y-axis, X-axis or both.
 * The grid draws nodes towards these sets of axises, creating a matrix of small gravitational spaces resulting in a more square looking graph.
 * This layout can help make some graphs look much more tidy.
 */
export default class Grid extends LayoutComponent {
	/**
	 * @param {Object} options - Options of the object
	 * @param {boolean=} options.useY - If true the Y axis force will be activated
	 * @param {boolean=} options.useX - If true the X axis force will be activated
	 * @param {number=} options.strength - How strong should the force that pulls node into the axis be?
	 * @param {number=} options.size - How large should each axis space be?
	 * @param {number=} options.offsetMultiplier - If no size is provided the size of nodes will be used. This multiplier can be used to multiply the measurements by a given number.
	 */
	constructor({ useX = true, useY = true, strength = 0.6, size = undefined, offsetMultiplier = 3 } = {}) {
		super()
		this.useX = useX
		this.useY = useY
		this.strength = strength
		this.size = size
		this.offsetMultiplier = offsetMultiplier
		this.maxSizeX = 0
		this.maxSizeY = 0
	}

	/**
	 * @param {import("../model/nodesandedges").LayoutNode} node
	 */
	getWidth(node) {
		return node.shape.width ? node.shape.width : node.shape.radius * 2
	}

	/**
	 * @param {import("../model/nodesandedges").LayoutNode} node
	 */
	getHeight(node) {
		return node.shape.height ? node.shape.height : node.shape.radius * 2
	}

	initialize(...args) {
		super.initialize(...args)
		if (this.size) {
			return
		}
		this.maxSizeX = 0
		this.maxSizeY = 0
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			this.maxSizeX = Math.max(this.maxSizeX, this.getWidth(node) * this.offsetMultiplier)
			this.maxSizeY = Math.max(this.maxSizeY, this.getHeight(node) * this.offsetMultiplier)
		}
		if (this.useY && this.useX) {
			const maxSize = Math.max(this.maxSizeX, this.maxSizeY)
			this.maxSizeX = maxSize
			this.maxSizeY = maxSize
		}
	}

	execute(alpha) {
		const force = alpha * this.strength
		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i]
			if (this.useY) {
				const closestArea = Math.round(node.y / this.maxSizeY) * this.maxSizeY
				node.vy -= (node.y - closestArea) * force
			}
			if (this.useX) {
				const closestArea = Math.round(node.x / this.maxSizeX) * this.maxSizeX
				node.vx -= (node.x - closestArea) * force
			}
		}
	}
}
