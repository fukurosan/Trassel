/** Options for the graph layout engine */
export interface IOptions {
	layout?: ILayoutOptions
}

/** Options for the layout engine */
export interface ILayoutOptions {
	/** Update cap (per second) for the layout loops' updates. */
	updateCap?: number
	/** Layout's initial alpha value. I.e. how volatile is each movement. */
	alpha?: number
	/** Initial minimum alpha value. I.e. When going below this the layout loop terminate. */
	alphaMin?: number
	/** Initial decay rate for the layout. I.e. how less volatile does it get on each update. */
	alphaDecay?: number
	/** Alpha target for the layout. This determines what alpha value the layout engine wants to reach (and stay at). */
	alphaTarget?: number
	/** Velocity decay determines how quickly velocity decreases. I.e. the friction of nodes in the graph. */
	velocityDecay?: number
}
