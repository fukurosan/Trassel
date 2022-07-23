import LayoutComponent from "./layoutcomponent"

/**
 * An adapter that is compatible with D3-forces used in D3's force simulation library.
 * @param {any} d3force - A D3 force simulation compatible force
 */
export default class D3Adapter extends LayoutComponent {
	constructor(d3force) {
		super()
		this.d3force = d3force
	}

	initialize(nodes, edges, utils) {
		super.initialize(nodes, edges, utils)
		if (this.d3force.links && typeof this.d3force.links === "function") {
			this.d3force.links(edges)
		}
		if (this.d3force.initialize) {
			this.d3force.initialize(nodes, this.random)
		}
	}

	execute(alpha) {
		this.d3force(alpha)
	}
}
