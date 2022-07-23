import LayoutComponent from "./layoutcomponent"

/**
 * Creates a cluster component that draws a set of nodes together
 * @param {number=} strength - How strong should the pull be? (0-1)
 */
export default class Cluster extends LayoutComponent {
	constructor(strength = 0.7) {
		super()
		this.strength = strength
	}

	initialize(...args) {
		super.initialize(...args)
	}

	execute(alpha) {
		let x = 0
		let y = 0
		let z = 0
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			const mass = node.mass ** 2
			x += node.x * mass
			y += node.y * mass
			z += mass
		}
		const centerX = x / z
		const centerY = y / z
		const force = alpha * this.strength
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			node.vx -= (node.x - centerX) * force
			node.vy -= (node.y - centerY) * force
		}
	}
}
