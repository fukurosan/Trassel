import LayoutComponent from "./layoutcomponent"

/**
 * An adapter that is compatible with D3-forces used in D3's force simulation library.
 */
export default class D3Adapter extends LayoutComponent {
	/**
	 * @param {(...args) => any} d3force - A D3 force simulation compatible force
	 */
	constructor(d3force) {
		super()
		this.d3force = d3force
	}

	initialize(nodes, edges, utils) {
		super.initialize(nodes, edges, utils)
		if (this.d3force.links && typeof this.d3force.links === "function") {
			this.d3force.links(edges)
		}
		if (this.d3force.initialize && typeof this.d3force.initialize === "function") {
			this.d3force.initialize(nodes, this.random)
		}
	}

	execute(alpha) {
		this.d3force(alpha)
	}
}
