import LayoutComponent from "./layoutcomponent"

/**
 * Creates a rectangular bounding box that stops nodes from leaving it
 */
export default class BoundingBox extends LayoutComponent {
	/**
	 * @param {Object} options - Options of the object
	 * @param {number=} options.width - Width of the box. If not set will be determined by the sizes and amounts of the nodes
	 * @param {number=} options.height - Height of the box. If not set will be determined by the sizes and amounts of the nodes
	 */
	constructor({ width = null, height = null } = {}) {
		super()
		this.width = width
		this.height = height
		this.computedWidth = width
		this.computedHeight = height
		this.multiplier = 5
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
		if (!this.width || !this.height) {
			let size = 0
			let node
			for (let i = 0; i < this.nodes.length; i++) {
				node = this.nodes[i]
				size += Math.max(size, this.getWidth(node) * this.multiplier, this.getHeight(node) * this.multiplier)
			}
			if (!this.width && !this.height) {
				this.computedWidth = size / 2
				this.computedHeight = size / 2
			} else if (!this.width) {
				this.computedWidth = size - this.height > 0 ? size - this.height : 100
			} else if (!this.height) {
				this.computedHeight = size - this.width > 0 ? size - this.width : 100
			}
		} else {
			this.computedWidth = this.width
			this.computedHeight = this.height
		}
		this.computedWidth = this.computedWidth / 2
		this.computedHeight = this.computedHeight / 2
	}

	execute() {
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			if (node.x < -this.computedWidth) {
				node.x = -this.computedWidth
			} else if (node.x > this.computedWidth) {
				node.x = this.computedWidth
			}
			if (node.y < -this.computedHeight) {
				node.y = -this.computedHeight
			} else if (node.y > this.computedHeight) {
				node.y = this.computedHeight
			}
		}
	}
}
