import Layout from "./layout"
import DataManager from "./datamanager"
import louvain from "./community/louvain"
import { initializeNodesAndEdges } from "./util/initializer"

/**
 * Main API for using the graph engine.
 */
export default class Graph {
	/**
	 * @param {import("./model/nodesandedges").DraftNode[]=} nodes - Initial nodes
	 * @param {import("./model/nodesandedges").DraftEdge[]=} edges - Initial edges
	 * @param {import("./model/ioptions").IOptions} options - options
	 */
	constructor(nodes = [], edges = [], options = {}) {
		const initialized = initializeNodesAndEdges(nodes, edges, options?.templates)
		/** @private @type { import("./model/nodesandedges").IGraphNode[] } */
		this.nodes = initialized.nodes
		/** @private @type { import("./model/nodesandedges").IGraphNode[] } */
		this.edges = initialized.edges
		/** @private @type { import("./model/ioptions").IOptions } */
		this.options = options
		/** @private @type { Layout } */
		this.layout = new Layout(nodes, edges, options?.layout)
		/** @private @type { DataManager } */
		this.dataManager = new DataManager(nodes, edges)
	}

	/**
	 * Sets the current alpha value in the layout.
	 * @param {number} alpha - Alpha value
	 * @returns {Graph}
	 */
	setLayoutAlpha(alpha) {
		this.layout.alpha = alpha
		return this
	}

	/**
	 * Sets the minimum allowed alpha value in the layout. When this value is reached the loop will end.
	 * @param {number} alphaMin - Minimum alpha value
	 * @returns {Graph}
	 */
	setLayoutAlphaMin(alphaMin) {
		this.layout.alphaMin = alphaMin
		return this
	}

	/**
	 * Sets the alpha decay rate in the layout. This determines how much the alpha value decreases on each update.
	 * @param {number} alphaDecay - Alpha decay rate
	 * @returns {Graph}
	 */
	setLayoutAlphaDecay(alphaDecay) {
		this.layout.alphaDecay = alphaDecay
		return this
	}

	/**
	 * Sets the alpha target in the layout. This sets what alpha value the layout is trying to reach.
	 * @param {number} alphaTarget - Target alpha value
	 * @returns {Graph}
	 */
	setLayoutAlphaTarget(alphaTarget) {
		this.layout.alphaTarget = alphaTarget
		return this
	}

	/**
	 * Sets the velocity decay rate in the layout.
	 * @param {number} velocityDecay - Velocity decay rate
	 * @returns {Graph}
	 */
	setLayoutVelocityDecay(velocityDecay) {
		this.layout.velocityDecay = velocityDecay
		return this
	}

	/**
	 * Sets the update cap (per second) for the layout loop
	 * @param {number} newCap - new cap
	 */
	setLayoutUpdateCap(newCap) {
		this.layout.setUpdateCap(newCap)
	}

	/**
	 * Computes communities (groups) based on nodes and edges in the graph
	 * Returns an array of communities, containing nodes grouped by belonging
	 * @returns {{communities: import("../model/nodesandedges").NodeID[][], communityTable: {[key: string]: any}}}
	 */
	computeCommunities() {
		return this.louvain()
	}

	/**
	 * Computes communities (groups) based on nodes and edges in the graph
	 * Returns an array of communities, containing nodes grouped by belonging
	 * @returns {{communities: import("../model/nodesandedges").NodeID[][], communityTable: {[key: string]: any}}}
	 */
	louvain() {
		return louvain(this.nodes, this.edges)
	}

	/**
	 * Updates the nodes and edges in the graph
	 * @param {import("./model/nodesandedges").IBasicNode[]} nodes
	 * @param {import("./model/nodesandedges").IBasicEdge[]} edges
	 * @returns {Graph}
	 */
	updateNodesAndEdges(nodes, edges) {
		this.nodes = nodes
		this.edges = edges
		this.layout.updateNodesAndEdges(nodes, edges)
		this.dataManager.updateNodesAndEdges(nodes, edges)
		return this
	}

	/**
	 * Starts the layout engine's loop
	 * @returns {Graph}
	 */
	startLayoutLoop() {
		this.layout.start()
		return this
	}

	/**
	 * Stops the layout engine
	 * @returns {Graph}
	 */
	stopLayoutLoop() {
		this.layout.stop()
		return this
	}

	/**
	 * Executes one update in the layout engine
	 * @param {boolean} sendEvent - Should an update event be fired?
	 * @returns {Graph}
	 */
	updateLayout(sendEvent = true) {
		this.layout.update(sendEvent)
		return this
	}

	/**
	 * Registers an event listener
	 * @param {(import("./model/events").EEvents} name - Event name to listen for
	 * @param {(() => any)} fn - Callback on event
	 * @returns {Graph}
	 */
	on(name, fn) {
		this.layout.on(name, fn)
		return this
	}

	/**
	 * Animates nodes from source positions to target positions within a duration provided.
	 * This function can be used to transition the graph between states or layouts.
	 * Once triggered the animation cannot be stopped. All other updates and components will be frozen until the animation completes.
	 * There should *never* be more than one animation running simultaneously.
	 * @param {import("./model/itargetnodestate").ITargetNodeState[]} targetNodeStates
	 * @param {number} duration - Animation duration in milliseconds
	 * @param {boolean} shouldFixateOnEnd - If true then the graph will fixate the nodes when the animation ends
	 */
	animateLayoutState(targetNodeStates = [], duration = 300, shouldFixateOnEnd = false) {
		this.layout.animateState(targetNodeStates, duration, shouldFixateOnEnd)
	}

	/**
	 * Adds a component to the layout engine
	 * @param {string} id - Unique identifier for the component
	 * @param {import("./model/ilayoutcomponent").ILayoutComponent} component - A layout component compatible class instance
	 * @param {(node: import("/model/nodesandedges").IGraphNode) => boolean=} nodeBindings - Function that computes if a node should be affected by the component. Blank means true for all.
	 * @param {(edge: import("./model/nodesandedges").IGraphEdge) => boolean=} edgeBindings - Function that computes if an edge should be affected by the component. Blank means true for all.
	 * @returns {Graph} - this
	 */
	addLayoutComponent(id, component, nodeBindings = null, edgeBindings = null) {
		this.layout.addLayoutComponent(id, component, nodeBindings, edgeBindings)
		return this
	}

	/**
	 * Removes a component with the specified ID
	 * @param {string} id
	 * @returns {Graph}
	 */
	removeLayoutComponent(id) {
		this.layout.removeComponent(id)
		return this
	}

	/**
	 * Finds the node closest to the provided coordinates in the graph
	 * @param {number} x
	 * @param {number} y
	 * @returns {import("/model/nodesandedges").IGraphNode} - The node
	 */
	findClosestNodeByCoordinates(x, y) {
		return this.layout.findClosestNodeByCoordinates(x, y)
	}

	/**
	 * Computes online nodes
	 * @returns {import("./model/nodesandedges").IBasicNode[]} node
	 */
	getOnlineNodes() {
		return this.dataManager.getOnlineNodes()
	}

	/**
	 * Computes offline nodes
	 * @returns {import("./model/nodesandedges").IBasicNode[]} node
	 */
	getOfflineNodes() {
		return this.dataManager.getOfflineNodes()
	}

	/**
	 * Computes online edges
	 * @returns {import("./model/nodesandedges").IBasicEdge[]} edge
	 */
	getOnlineEdges() {
		this.dataManager.getOnlineEdges()
	}

	/**
	 * Computes offline edges
	 * @returns {import("./model/nodesandedges").IBasicEdge[]} edge
	 */
	getOfflineEdges() {
		this.dataManager.getOfflineEdges()
	}

	/**
	 * Checks if an edge is online
	 * @param {import("./model/nodesandedges").IBasicEdge} edge
	 * @returns {boolean}
	 */
	isEdgeOnline(edge) {
		return this.dataManager.isEdgeOnline(edge)
	}

	/**
	 * Checks if a node is online
	 * @param {string} nodeID
	 * @returns {boolean}
	 */
	isNodeOnline(nodeID) {
		return this.dataManager.isNodeOnline(nodeID)
	}

	/**
	 * Brings the list of node IDs offline
	 * @param {import("./model/nodesandedges").NodeID[]} nodeIDs
	 */
	bringNodesOffline(nodeIDs) {
		this.dataManager.bringNodesOffline(nodeIDs)
		this.nodes = this.dataManager.getOnlineNodes()
		this.edges = this.dataManager.getOnlineEdges()
		this.layout.updateNodesAndEdges(this.nodes, this.edges)
	}

	/**
	 * Brings the list of node IDs online
	 * @param {import("./model/nodesandedges").NodeID[]} nodeIDs
	 */
	bringNodesOnline(nodeIDs) {
		this.dataManager.bringNodesOnline(nodeIDs)
		this.nodes = this.dataManager.getOnlineNodes()
		this.edges = this.dataManager.getOnlineEdges()
		this.layout.updateNodesAndEdges(this.nodes, this.edges)
	}

	bringAllNodesOffline() {
		this.dataManager.bringAllNodesOffline()
		this.nodes = []
		this.edges = []
		this.layout.updateNodesAndEdges(this.nodes, this.edges)
	}

	bringAllNodesOnline() {
		this.dataManager.bringAllNodesOnline()
		this.nodes = this.dataManager.getOnlineNodes()
		this.edges = this.dataManager.getOnlineEdges()
		this.layout.updateNodesAndEdges(this.nodes, this.edges)
	}

	/**
	 * Retrieves all neighbors for a given nodeID
	 * @param {import("./model/nodesandedges").NodeID} nodeID - ID od the node neighbors should be retrieved for
	 * @param {boolean} isDirected - Only traverse edges where the input node is the sourceNode
	 * @param {boolean} useOnlyOnline - Only traverse neighbors that are online
	 * @param {boolean} ignoreInternalEdges - Ignore self-edges
	 * @returns {import("./model/nodesandedges").NodeID[]}
	 */
	getNeighbors(nodeID, isDirected = false, useOnlyOnline = true, ignoreInternalEdges = true) {
		return this.dataManager.getNeighbors(nodeID, isDirected, useOnlyOnline, ignoreInternalEdges)
	}

	/**
	 * Computes collateral nodes in implodes or explode operations from a root node (I.e. bringing connected neighbors online/offline)
	 * This function will not apply any changes, but return an array with affected nodes
	 * The function exists specifically to help applications that implement implode/explode functionality in graphs
	 * and need to compute what nodes should be brough online/offline.
	 * @param {import("./model/nodesandedges").NodeID} nodeID
	 * @param {boolean} isBringOnline - If true neighbors will be brought online otherwise offline
	 * @param {boolean} isDirected - If true then operation will be directed
	 * @param {"single"|"recursive"|"leafs"} mode - Single means all neighbors are affected, leafs means only neighbors with no other neighbors are affected, recursive means neighbors recursively are affected.
	 * @returns {import("./model/nodesandedges").NodeID[]} - Affected nodes
	 */
	computeImplodeOrExplodeNode(nodeID, isBringOnline = false, isDirected = true, mode = "single") {
		return this.dataManager.computeImplodeOrExplodeNode(nodeID, isBringOnline, isDirected, mode)
	}

	/**
	 * Specifically meant to support renderers in determining optimal target positions for nodes that are being brough online.
	 * Accepts an array of node IDs and origin coordinates where the nodes should be animated from.
	 * Returns an array of vertices with optimal positions based on other neighbors present in the graph, or in the case of leafs a circle around the origin.
	 * Note(!) that this function expects all nodes and edges to have been initialized into GraphNodes and GraphEdges in order to compute this information.
	 * @param {import("./model/nodesandedges").NodeID[]} nodeIDs - Array of node IDs
	 * @param {number} distance - Default distance from origin position to put nodes (for non-average values only!)
	 * @param {number} originX - Start position for the transition
	 * @param {number} originY - Start position for the transition
	 * @returns {{id: import("./model/nodesandedges").NodeID, x: number, y: numer}[]} - Target coordinates
	 */
	stageNodePositions(nodeIDs = [], distance = 300, originX = 0, originY = 0) {
		return this.dataManager.stageNodePositions(nodeIDs, distance, originX, originY)
	}

	/**
	 * Computes the shortest path from one node to another. Returns an array with the nodeIDs, or null if there is no path.
	 * @param {import("./model/nodesandedges").NodeID} startNode - Node ID where the road starts
	 * @param {import("./model/nodesandedges").NodeID} endNode - Node ID where the road ends
	 * @param {boolean} useOnlyOnline - If true the shortest path will only be computed for live nodes
	 * @param {boolean} isDirected - If true then operation will be directed
	 * @return {import("./model/nodesandedges").NodeID[]} - Array of node IDs from startnode to endnode containing the (a) shortest path
	 */
	findShortestPathUnweighted(startNode, endNode, useOnlyOnline = true, isDirected = true) {
		return this.dataManager.findShortestPathUnweighted(startNode, endNode, useOnlyOnline, isDirected)
	}

	/**
	 * Computes the shortest path from one node to another. Returns an array with the nodeIDs, or null if there is no path.
	 * This is basically Dijkstra's algorithm:
	 * https://en.wikipedia.org/wiki/Dijkstra's_algorithm
	 * @param {import("./model/nodesandedges").NodeID} startNode - Node ID where the road starts
	 * @param {import("./model/nodesandedges").NodeID} endNode - Node ID where the road ends
	 * @param {boolean} useOnlyOnline - If true the shortest path will only be computed for live nodes
	 * @param {boolean} isDirected - If true then operation will be directed
	 * @param {boolean} aggregateEdgeWeights - If true then weights for all edges between a set of nodes are aggregated and treated as a single edge
	 * @return {{id: import("./model/nodesandedges").NodeID, cost: number}[]} - Array of nodes and costs from startnode to endnode containing the (a) cheapest path
	 */
	findShortestPathWeighted(startNode, endNode, useOnlyOnline = true, isDirected = true, aggregateEdgeWeights = false) {
		return this.dataManager.findShortestPathWeighted(startNode, endNode, useOnlyOnline, isDirected, aggregateEdgeWeights)
	}

	/**
	 * Computes strongly connected components in the graph.
	 * Basically an implementation of Kosoraju's algorithm.
	 * https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm
	 * @param {boolean} useOnlyOnline - If true the shortest path will only be computed for live nodes
	 * @return {("./model/nodesandedges").NodeID[][]} - Strongly connected components.
	 */
	computeStronglyConnectedComponents(useOnlyOnline = true) {
		return this.dataManager.computeStronglyConnectedComponents(useOnlyOnline)
	}

	/**
	 * Executes a breadth-first search in the graph given a start node.
	 * Each node encountered will be handed off to a callback function provided,
	 * If the callback function returns true then that branch will be terminated.
	 * @param {import("./model/nodesandedges").NodeID} startNode
	 * @param {(import("./model/nodesandedges").NodeID) => void|true} callback
	 * @param {boolean} useOnlyOnline - If true only online nodes will be processed
	 * @param {boolean} isDirected - If true then traversal will be directed
	 */
	BFS(startNode, callback, useOnlyOnline = true, isDirected = true) {
		this.dataManager.BFS(startNode, callback, useOnlyOnline, isDirected)
	}

	/**
	 * Executes a depth-first search in the graph given a start node.
	 * Each node encountered will be handed off to a callback function provided,
	 * If the callback function returns true then that branch will be terminated.
	 * @param {import("./model/nodesandedges").NodeID} startNode
	 * @param {(import("./model/nodesandedges").NodeID) => void|true} callback
	 * @param {boolean} useOnlyOnline - If true only online nodes will be processed
	 * @param {boolean} isDirected - If true then traversal will be directed
	 */
	DFS(startNode, callback, useOnlyOnline = true, isDirected = true) {
		this.dataManager.DFS(startNode, callback, useOnlyOnline, isDirected)
	}
}
