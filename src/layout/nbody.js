import LayoutComponent from "./layoutcomponent"

/**
 * An n-body approximation based on Barnes and Hut.
 * To read more:
 * https://people.eecs.berkeley.edu/~demmel/cs267/lecture26/lecture26.html
 * https://jheer.github.io/barnes-hut/
 * @param {number=} theta - Parameter used to control performance vs accuracy. Should be around 1 +/- 0,3
 * @param {number=} distanceMax - The maximum distance between nodes to consider approximations
 * @param {number=} distanceMin - The minimum distance between nodes to consider approxiamations
 * @param {boolean=} isRepulse - If true nodes push each other away, if false nodes attract each other
 */
export default class NBody extends LayoutComponent {
	constructor(theta = 1.1, distanceMax = Infinity, distanceMin = 1, isRepulse = true) {
		super()
		this.theta = theta
		this.distanceMax = distanceMax
		this.distanceMin = distanceMin
		this.isRepulse = isRepulse
	}

	initialize(...args) {
		super.initialize(...args)
	}

	execute(alpha) {
		//The mass of all quadrants must be precomputed for the approximation to work
		this.utils.quadtree.computeMass()

		//Perform Barnes-Hut n-body simulation on the nodes
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			this.utils.quadtree.traverseTopBottom((quadNode, xStart, yStart, xEnd) => {
				//If the quadNode has no mass then end the traversal for this quadrant
				if (!quadNode.mass) {
					return true
				}

				let x = quadNode.x - node.x
				let y = quadNode.y - node.y
				const quadrantWidth = xEnd - xStart
				let distanceSquared = x * x + y * y

				// If the width squared divided by theta is less than the distance squared then we should apply the approximation
				if ((quadrantWidth * quadrantWidth) / this.theta < distanceSquared) {
					if (distanceSquared < this.distanceMax) {
						//If x or y is zero then randomize the position
						if (x === 0) {
							x = this.randomize()
							distanceSquared += x * x
						}
						if (y === 0) {
							y = this.randomize()
							distanceSquared += y * y
						}
						//If the distance is too small then limit the force
						//This is to guard against too strong forces.
						if (distanceSquared < this.distanceMin) {
							distanceSquared = Math.sqrt(this.distanceMin * distanceSquared)
						}
						const force = (this.isRepulse ? -quadNode.mass * alpha : quadNode.mass * alpha) / distanceSquared
						node.vx += x * force
						node.vy += y * force
					}
					//Since we have now applied the force of this quadNode we will not traverse the quadrant any further
					return true
				}

				//If we are too far away, or if there are child quadrants, we traverse downwards one level.
				else if (quadNode.length || distanceSquared >= this.distanceMax) {
					return false
				}

				//This is a leaf node, and does not violate any distance requirements
				//This could for example be if the quadrant does not split any deeper, meaning this is as exact as it gets
				//We are only interested if the entity is not this node itself
				if (quadNode.entity !== node || quadNode.next) {
					//This adjustment is a duplication, but a function invocation would be too expensive
					if (x === 0) {
						x = this.randomize()
						distanceSquared += x * x
					}
					if (y === 0) {
						y = this.randomize()
						distanceSquared += y * y
					}
					if (distanceSquared < this.distanceMin) {
						distanceSquared = Math.sqrt(this.distanceMin * distanceSquared)
					}

					do {
						if (quadNode.entity !== node) {
							const force = (this.isRepulse ? -quadNode.mass * alpha : quadNode.mass * alpha) / distanceSquared
							node.vx += x * force
							node.vy += y * force
						}
					} while ((quadNode = quadNode.next))
				}
			})
		}
	}
}
