import LayoutComponent from "./layoutcomponent"

/**
 * Creates a gravitational force that pulls the x or y axis of nodes towards a given coordinate
 * Two sets of attraction components can commonly be used to create a gravitational force towards a center area
 * This can also be use to draw nodes away from a given point, if a negative strength is provided.
 * @param {number=} isHorizontal - true = x, false = y
 * @param {number=} coordinate - the center coordinate of the component
 * @param {number=} strength - The strength of the pull
 */
export default class Attraction extends LayoutComponent {
	constructor(isHorizontal = true, coordinate = 0, strength = 0.05) {
		super()
		this.isHorizontal = isHorizontal
		this.coordinate = coordinate
		this.strength = strength
	}

	initialize(...args) {
		super.initialize(...args)
	}

	execute(alpha) {
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			node[this.isHorizontal ? "vx" : "vy"] += (this.coordinate - node[this.isHorizontal ? "x" : "y"]) * this.strength * alpha
		}
	}
}
