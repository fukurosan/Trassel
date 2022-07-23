import LayoutComponent from "./layoutcomponent"

/**
 * Collision component that stops nodes from colliding (and thus overlapping)
 * Note that this component considers all nodes to be circles. If a node is square then the maximum measurement will be considered the diameter.
 * @param {number=} strength - The strength of the collision repulsion
 * @param {number=} radiusPadding - Padding that will be added to all radiuses
 */
export default class Collision extends LayoutComponent {
	constructor(strength = 1, radiusPadding = 5) {
		super()
		this.strength = strength
		this.radiusPadding = radiusPadding
	}

	initialize(...args) {
		super.initialize(...args)
	}

	execute() {
		//Ensure radiuses have been recorded
		this.utils.quadtree.computeLargestRadius(this.radiusPadding)

		let node
		let computedNodeRadius
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			computedNodeRadius = node.radius + this.radiusPadding
			this.utils.quadtree.traverseTopBottom((quadNode, xStart, yStart, xEnd, yEnd) => {
				const data = quadNode.entity
				const otherNodeRadius = quadNode.radius + this.radiusPadding
				const combinedRadius = computedNodeRadius + otherNodeRadius
				if (data) {
					//This ensures we do not evaluate the same node combination twice
					if (data.index >= node.index) {
						return
					}
					//Compute the distance between the nodes
					let x = node.x - data.x
					let y = node.y - data.y
					let distanceSquared = x * x + y * y
					//if x^2 + y^2 < r^2 then the two circles are colliding
					if (distanceSquared < combinedRadius * combinedRadius) {
						//we ensure x and y cannot be 0 to guard against 0 divisional error
						if (x === 0) {
							x = this.randomize()
							distanceSquared += x * x
						}
						if (y === 0) {
							y = this.randomize()
							distanceSquared += y * y
						}
						//Compute the actual distance and the force by which the nodes should be adjusted
						const distance = Math.sqrt(distanceSquared)
						const force = ((combinedRadius - distance) / distance) * this.strength
						const xForce = x * force
						const yForce = y * force

						//Compute how much of the force should be applied to node 1 and to node 2 respectively
						const otherNodeRadiusSquared = otherNodeRadius * otherNodeRadius
						const currentNodeRadiusSquared = computedNodeRadius * computedNodeRadius
						const otherRadiusRatio = otherNodeRadiusSquared / (currentNodeRadiusSquared + otherNodeRadiusSquared)
						//Apply force
						node.vx += xForce * otherRadiusRatio
						node.vy += yForce * otherRadiusRatio
						const currentNodeRatio = 1 - otherRadiusRatio
						data.vx -= xForce * currentNodeRatio
						data.vy -= yForce * currentNodeRatio
					}
					return
				}
				return xStart > node.x + combinedRadius || xEnd < node.x - combinedRadius || yStart > node.y + combinedRadius || yEnd < node.y - combinedRadius
			})
		}
	}
}
