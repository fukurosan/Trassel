import baryCenter from "./algorithms/barycenter"
import LayoutComponent from "./layoutcomponent"

/**
 * Creates a matrix of all nodes.
 */
export default class Matrix extends LayoutComponent {
	/**
	 * @param {Object} options - Options of the object
	 * @param {number=} options.centerX - Center X coordinate of the component
	 * @param {number=} options.centerY - Center Y coordinate of the component
	 */
	constructor({ centerX = null, centerY = null } = {}) {
		super()
		this.centerX = centerX
		this.centerY = centerY
		this.maxSize = 0
		this.numberOfRowsAndColumns = 0
		this.halfSize = 0
		this.multiplier = 2
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
		this.nodes = baryCenter(this.nodes, this.edges)
		this.maxSize = 0
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			this.maxSize = Math.max(this.maxSize, this.getWidth(node) * this.multiplier, this.getHeight(node) * this.multiplier)
		}
		this.numberOfRowsAndColumns = Math.ceil(Math.sqrt(this.nodes.length))
		this.halfSize = ((this.numberOfRowsAndColumns - 1) * this.maxSize) / 2
		//Center will only be determined on the first initialization
		const averageCoordinates = this.getAverageCoordinates()
		this.centerX === null && (this.centerX = averageCoordinates[0])
		this.centerY === null && (this.centerY = averageCoordinates[1])
	}

	execute() {
		//const force = alpha * this.strength 0.9
		let currentRow = 0
		let currentColumn = 0
		for (let i = 0; i < this.nodes.length; i++) {
			if (currentColumn === this.numberOfRowsAndColumns) {
				currentColumn = 0
				currentRow += 1
			}
			currentColumn += 1
			const node = this.nodes[i]
			node.fx = (currentColumn - 1) * this.maxSize - this.halfSize + this.centerX + node.shape.radius
			node.fy = currentRow * this.maxSize - this.halfSize + this.centerY + node.shape.radius
			//node.vx -= (node.x - ((currentColumn - 1) * this.maxSize - this.halfSize) + this.centerX) * force
			//node.vy -= (node.y - (currentRow * this.maxSize - this.halfSize) + this.centerY) * force
		}
	}

	dismount() {
		this.nodes.forEach(node => {
			delete node.fx
			delete node.fy
		})
	}
}
