import baryCenter from "./algorithms/barycenter"
import LayoutComponent from "./layoutcomponent"

/**
 * Creates a matrix of all nodes.
 * @param {number=} centerX - Center X coordinate of the component
 * @param {number=} centerY - Center Y coordinate of the component
 */
export default class Matrix extends LayoutComponent {
	constructor(centerX = null, centerY = null) {
		super()
		this.centerX = centerX
		this.centerY = centerY
		this.maxSize = 0
		this.numberOfRowsAndColumns = 0
		this.halfSize = 0
		this.multiplier = 2
	}

	getWidth(node) {
		return node.width ? node.width : node.radius * 2
	}

	getHeight(node) {
		return node.height ? node.height : node.radius * 2
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
			node.fx = (currentColumn - 1) * this.maxSize - this.halfSize + this.centerX + node.radius
			node.fy = currentRow * this.maxSize - this.halfSize + this.centerY + node.radius
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
