import LayoutComponent from "./layoutcomponent"

/**
 * Moves a node from its current position to a provided destination
 * Note that this component uses fx and fy, which could create conflicts with things like pinning mechanisms
 * targetX and targetY coordinates can be set on specific nodes, or component global values can be provided.
 * @param {number=} xDestination - Destination X coordinate
 * @param {number=} yDestination - Destination Y coordinate
 * @param {number=} strength - The strength of the pull
 * @param {number=} removeForceOnDestination - If true the component will be removed from the layout when animation is completed
 */
export default class Animation extends LayoutComponent {
	constructor(xDestination = 0, yDestination = 0, strength = 1, removeForceOnDestination = true) {
		super()
		this.xDestination = xDestination
		this.yDestination = yDestination
		this.strength = strength
		this.removeForceOnDestination = removeForceOnDestination
	}

	initialize(...args) {
		super.initialize(...args)
	}

	execute(alpha) {
		let node
		let xDestination
		let yDestination
		let arrived = 0
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			xDestination = node.targetX ? node.targetX : this.xDestination
			yDestination = node.targetY ? node.targetY : this.yDestination
			!node.fx && (node.fx = node.x)
			!node.fy && (node.fy = node.y)
			const xMovement = ((xDestination - node.x) * this.strength * alpha) / 2
			const yMovement = ((yDestination - node.y) * this.strength * alpha) / 2
			xMovement > 1 ? (node.fx += xMovement) : (node.fx = xDestination)
			yMovement > 1 ? (node.fy += yMovement) : (node.fy = yDestination)
			node.fx === xDestination && node.fy === yDestination && arrived++
		}
		if (this.removeForceOnDestination && arrived === this.nodes.length) {
			for (let i = 0; i < this.nodes.length; i++) {
				node = this.nodes[i]
				node.x = node.fx
				node.y = node.fy
				node.vx = 0
				node.vy = 0
				node.fx = undefined
				node.fy = undefined
			}
			this.utils.remove()
		}
	}
}
