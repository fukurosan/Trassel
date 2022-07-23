import LayoutComponent from "./layoutcomponent"

/**
 * Component that pulls connected nodes closer to each other.
 * I.e. nodes that have edges between them.
 */
export default class Link extends LayoutComponent {
	constructor() {
		super()
		this.count = []
		this.bias = []
	}

	initialize(...args) {
		super.initialize(...args)
		this.count = new Array(this.edges.length)
		this.bias = new Array(this.edges.length)
		for (let i = 0; i < this.edges.length; i++) {
			const edge = this.edges[i]
			this.count[edge.source.index] = (this.count[edge.source.index] || 0) + 1
			this.count[edge.target.index] = (this.count[edge.target.index] || 0) + 1
		}
		for (let i = 0; i < this.edges.length; i++) {
			const edge = this.edges[i]
			this.bias[i] = this.count[edge.source.index] / (this.count[edge.source.index] + this.count[edge.target.index])
		}
	}

	execute(alpha) {
		let xDistance
		let yDistance
		let distanceSquared
		let force
		let xAdjustment
		let yAdjustment
		let bias
		let edge
		for (let i = 0; i < this.edges.length; i++) {
			edge = this.edges[i]
			xDistance = edge.target.x + edge.target.vx - edge.source.x - edge.source.vx || this.randomize()
			yDistance = edge.target.y + edge.target.vy - edge.source.y - edge.source.vy || this.randomize()
			distanceSquared = Math.sqrt(xDistance * xDistance + yDistance * yDistance)
			force = ((distanceSquared - edge.distance) / distanceSquared) * alpha * edge.strength
			xAdjustment = xDistance * force
			yAdjustment = yDistance * force
			bias = this.bias[i]
			edge.target.vx -= xAdjustment * bias
			edge.target.vy -= yAdjustment * bias
			bias = 1 - bias
			edge.source.vx += xAdjustment * bias
			edge.source.vy += yAdjustment * bias
		}
	}
}
