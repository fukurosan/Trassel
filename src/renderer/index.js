import { WebGLRenderer } from "./renderer"

export class Renderer {
	constructor(element, nodes = [], edges = [], options = {}) {
		this.WebGLRenderer = new WebGLRenderer(element, nodes, edges, options)
	}

	/**
	 * Initializes the renderer. Must be called before rendering anything!
	 */
	async initialize() {
		await this.WebGLRenderer.initialize()
	}

	/**
	 * Registers an event listener
	 * @param {string} name - Event name to listen for
	 * @param {() => any} fn - Callback on event
	 */
	on(name, fn) {
		this.WebGLRenderer.on(name, fn)
	}

	/**
	 * Toggles the lasso selector on and off
	 * @param {boolean} newStatus - If provided the lasso status will be set, otherwise toggled
	 */
	toggleLasso(newStatus) {
		this.WebGLRenderer.toggleLasso(newStatus)
	}

	/**
	 * Selects or deselects a node.
	 * @param {{id: string, renderer: { _private: { selected: boolean } }}} node
	 * @param {boolean} value - Optional value to set. If ommitted current value will be toggled.
	 */
	toggleSelectNode(node, value = null) {
		this.WebGLRenderer.toggleSelectNode(node, value)
	}

	/**
	 * Updates the nodes and edges in the renderer.
	 * @param {import("../model/rendereroptions").INodeWithRendererOptions[]} nodes
	 * @param {import("../model/rendereroptions").IEdgeWithRendererOptions[]} edges
	 */
	async updateNodesAndEdges(nodes, edges) {
		await this.WebGLRenderer.updateNodesAndEdges(nodes, edges)
	}

	/**
	 * Returns if the node is selected or not
	 * @param {import("../model/ibasicnode").IBasicNode} - Node to check
	 * @returns {boolean} - selected status
	 */
	isNodeSelected(node) {
		return this.WebGLRenderer.isNodeSelected(node)
	}

	/**
	 * Clears all node selections
	 */
	clearAllNodeSelections() {
		this.WebGLRenderer.clearAllNodeSelections()
	}

	/**
	 * Sets the line type for edges
	 * @param {"line" | "taxi" | "orthogonal" | "cubicbezier"} newType
	 */
	setLineType(newType) {
		this.WebGLRenderer.setLineType(newType)
	}

	/**
	 * scales and moves the view so that all nodes are included in the view
	 * @param {number} duration - Time in milliseconds for the transition
	 */
	zoomToFit(duration = 200) {
		this.WebGLRenderer.zoomToFit(duration)
	}

	/**
	 * Sets new coordinates and scale for the renderer's stage
	 * @param {number} x
	 * @param {number} y
	 * @param {number} scale
	 */
	setTransform(x, y, scale) {
		this.WebGLRenderer.setTransform(x, y, scale)
	}

	/**
	 * Takes coordinates from the viewport as input and returns the local (relative) coordinates
	 * @param {number} x - Viewport X coordinate
	 * @param {number} y - Viewport Y coordinate
	 */
	viewportToLocalCoordinates(x, y) {
		return this.WebGLRenderer.viewportToLocalCoordinates(x, y)
	}

	/**
	 * Takes coordinates from the graph as input and returns the corresponding viewport coordinates
	 * @param {number} x - Local X coordinate
	 * @param {number} y - Local Y coordinate
	 */
	localToViewportCoordinates(x, y) {
		return this.WebGLRenderer.localToViewportCoordinates(x, y)
	}

	/**
	 * disables and grays out nodes that match a given filter function.
	 * Connected edges will also be disabled.
	 * @param {import("../model/rendereroptions").INodeWithRendererOptions => boolean} fn - filter function for nodes
	 */
	disableNodes(fn) {
		this.WebGLRenderer.disableNodes(fn)
	}

	/**
	 * Clears all disabled statuses on nodes and edges
	 */
	clearAllDisabledStatuses() {
		this.WebGLRenderer.clearAllDisabledStatuses()
	}

	/**
	 * Cleanup function when dismounting.
	 */
	dismount() {
		this.WebGLRenderer.dismount()
	}

	/**
	 * Main render function that updates the canvas.
	 * This can be used to trigger manual updates.
	 */
	render() {
		this.WebGLRenderer.render()
	}
}
