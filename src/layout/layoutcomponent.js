import lcg from "../util/lcg"
import Quadtree from "../util/quadtree"

/**
 * The base class for all layout components
 */
export default class LayoutComponent {
	constructor() {
		/** @type {import("../model/igraphnode").IGraphNode[]} */
		this.nodes = []
		/** @type {import("../model/igraphedge").IGraphEdge[]} */
		this.edges = []
		this.random = lcg()
		this.utils = { quadtree: new Quadtree(), remove: () => {} }
	}

	/**
	 * Returns a random number between 0-1
	 * @returns {number} A random number between 0-1
	 */
	randomize() {
		return (this.random() - 0.5) * 1e-6
	}

	getCenterCoordinates() {
		let minX = Infinity
		let maxX = -Infinity
		let minY = Infinity
		let maxY = -Infinity
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			node.x < minX && (minX = node.x)
			node.y < minY && (minY = node.y)
			node.x > maxX && (maxX = node.x)
			node.y > maxY && (maxY = node.y)
		}
		return [(maxX - minX) / 2, (maxY - minY) / 2]
	}

	getAverageCoordinates() {
		const x = this.nodes.reduce((acc, node) => acc + node.x, 0) / this.nodes.length
		const y = this.nodes.reduce((acc, node) => acc + node.y, 0) / this.nodes.length
		return [x, y]
	}

	initialize(nodes, edges, utils) {
		this.nodes = nodes
		this.edges = edges
		this.utils = utils
	}

	dismount() {}

	execute() {}
}
