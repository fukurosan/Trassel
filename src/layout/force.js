import LayoutComponent from "./layoutcomponent"

/**
 * A force directed layout component using Fruchterman's & Reingold's algorithm.
 */
export default class Force extends LayoutComponent {
	/**
	 * @param {Object} options
	 * @param {number=} options.size - Parameter used to control the size of the graph. Generally a fairly high number.
	 * @param {number=} options.gravity - Strength of the gravity in the layout
	 * @param {number=} options.speed - The speed at which things move in the graph.
	 */
	constructor({ size = null, speed = 0.1, gravity = 0.75 } = {}) {
		super()
		this.size = size
		this.gravity = gravity
		this.speed = speed
		this.nodeDisplacementMap = new Map()
	}

	initialize(...args) {
		super.initialize(...args)
		this.nodeDisplacementMap = new Map(this.nodes.map(node => [node, { dx: 0, dy: 0 }]))
	}

	execute(alpha) {
		const nodeCount = this.nodes.length
		const edgeCount = this.edges.length
		const power = this.size ? this.size : nodeCount * 20000
		const maxDisplace = Math.sqrt(power) / 10
		const k = Math.sqrt(power / (1 + nodeCount))
		//Compute repulsion
		let node
		let node2
		for (let i = 0; i < nodeCount; i++) {
			node = this.nodes[i]
			const displacement = this.nodeDisplacementMap.get(node)
			for (let j = 0; j < nodeCount; j++) {
				node2 = this.nodes[j]
				if (node.id != node2.id) {
					const xDistance = node.x - node2.x
					const yDistance = node.y - node2.y
					const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance) + 0.01
					if (distance > 0) {
						const repulsiveForce = (k * k) / distance
						displacement.dx += (xDistance / distance) * repulsiveForce
						displacement.dy += (yDistance / distance) * repulsiveForce
					}
				}
			}
		}
		//Compute attraction
		let edge
		for (let i = 0; i < edgeCount; i++) {
			edge = this.edges[i]
			const xDistance = edge.source.x - edge.target.x
			const yDistance = edge.source.y - edge.target.y
			const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance) + 0.01
			const attractionForce = (distance * distance) / k
			const sourceDisplayment = this.nodeDisplacementMap.get(edge.source)
			const targetDisplayment = this.nodeDisplacementMap.get(edge.target)
			if (distance > 0) {
				sourceDisplayment.dx -= (xDistance / distance) * attractionForce
				sourceDisplayment.dy -= (yDistance / distance) * attractionForce
				targetDisplayment.dx += (xDistance / distance) * attractionForce
				targetDisplayment.dy += (yDistance / distance) * attractionForce
			}
		}
		//Compute gravity, speed and apply displacement
		for (let i = 0; i < nodeCount; i++) {
			node = this.nodes[i]
			const displacement = this.nodeDisplacementMap.get(node)
			//Gravity
			const distance = Math.sqrt(node.x * node.x + node.y * node.y)
			const gravityForce = 0.01 * k * this.gravity * distance
			displacement.dx -= (gravityForce * node.x) / distance
			displacement.dy -= (gravityForce * node.y) / distance
			//Speed
			displacement.dx *= this.speed
			displacement.dy *= this.speed
			//Apply displacement
			const displacementDistance = Math.sqrt(displacement.dx * displacement.dx + displacement.dy * displacement.dy)
			if (displacementDistance > 0) {
				const limitedDist = Math.min(maxDisplace * this.speed, displacementDistance)
				//node.x += displacement.dx / displacementDistance * limitedDist
				//node.y += displacement.dy / displacementDistance * limitedDist
				node.vx += (displacement.dx / displacementDistance) * limitedDist * alpha
				node.vy += (displacement.dy / displacementDistance) * limitedDist * alpha
			}
		}
	}
}
