/**
 * The data store class is responsible to storing and managing all edges and nodes.
 * The data store can execute computations such as bringing nodes offline from the graph
 * or computing components and paths.
 */
export default class DataManager {
	/**
	 * Constructor
	 * @param {import("./model/ibasicnode").IBasicNode[]} nodes
	 * @param {import("./model/ibasicnode").IBasicEdge[]} edges
	 */
	constructor(nodes = [], edges = []) {
		/**
		 * All Nodes in the data manager regardless of online/offline status
		 * @type {import("./model/nodeid").NodeID[]} */
		this.allNodes = []
		/**
		 * All edges in the data manager regardless of online/offline status
		 * @type {import("./model/ibasicedge").IBasicEdge[]} */
		this.allEdges = []
		/**
		 * A set that contains all currently online nodes. Used for example when we want to process a large dataset
		 * but only want to expose a small subset of data to an application, renderer or other process.
		 * @type {Set<import("./model/nodeid").NodeID>} */
		this.onlineNodes = new Set()
		/**
		 * A lookup table for node objects. Generally "nodes" in the data manager are just IDs
		 * @type {Map<import("./model/nodeid").NodeID, import("./model/ibasicnode").IBasicNode>} */
		this.nodeLookupMap = new Map()
		/**
		 * A lookup table where the keys are sourceNodes and targets are targetNodes, their full weight and all relevant edge objects.
		 * @type {Map<import("./model/nodeid").NodeID, { id: import("./model/nodeid").NodeID, edges: import("./model/ibasicedge").IBasicEdge[], weight: number }[]>} */
		this.sourceToTargetMap = new Map()
		/**
		 * A lookup table where the keys are targetNodes and targets are sourceNodes, their full weight and all relevant edge objects.
		 * @type {Map<import("./model/nodeid").NodeID, { id: import("./model/nodeid").NodeID, edges: import("./model/ibasicedge").IBasicEdge[], weight: number }[]>} */
		this.targetToSourceMap = new Map()
		/**
		 * A lookup table for undirected edges (basically merging sourceToTarget and targetToSource.
		 * @type {Map<import("./model/nodeid").NodeID, { id: import("./model/nodeid").NodeID, edges: import("./model/ibasicedge").IBasicEdge[], weight: number }[]>} */
		this.nodeToNeighborsMap = new Map()
		/**
		 * Edge indexes mapping an edge to how many other edges share the same sources and targets and what index it has.
		 * This information is useful for renderers to determine angles and bends of edges to minimize overlap.
		 * E.g. if there are two edges connecting node X and node Y, then these would overlap visually.
		 * @type {Map<string, {total: number, index: number}>}
		 */
		this.edgeIndexes = new Map()
		/**
		 * This is a counter for each node of how many offline edges in the graph connects with it.
		 * This information is useful to renderers when displaying partial information, and showing meta data about hidden points.
		 * E.g. a badge on a node in the graph with "42" on it, indicating 42 hidden connections.
		 * @type {Map<import("./model/nodeid").NodeID, {sourceNode: number, targetNode: number, internal: number}>}
		 */
		this.offlineEdgeCounter = new Map()
		this.updateNodesAndEdges(nodes, edges)
	}

	/**
	 * Updates the data in the manager
	 * @param {import("./model/ibasicnode").IBasicNode[]} nodes - New nodes
	 * @param {import("./model/ibasicedge").IBasicEdge[]} edges - New Edges
	 */
	updateNodesAndEdges(nodes, edges) {
		//All added nodes will be seen as online
		nodes.forEach(node => {
			!this.nodeLookupMap.has(node.id) && this.onlineNodes.add(node.id)
		})
		this.nodeLookupMap = new Map(nodes.map(node => [node.id, node]))
		//All removed nodes must be removed from the onlineNodes set
		this.allNodes.forEach(nodeID => {
			!this.nodeLookupMap.has(nodeID) && this.onlineNodes.delete(nodeID)
		})
		this.allNodes = nodes.map(node => node.id)
		this.allEdges = [...edges]
		//In the below step we will aggregate edges between nodes and compute data about the relationships
		const sourceToTargetLookup = new Map(this.allNodes.map(node => [node, new Map()]))
		const targetToSourceLookup = new Map(this.allNodes.map(node => [node, new Map()]))
		const nodeToNeighborsLookup = new Map(this.allNodes.map(node => [node, new Map()]))
		const aggregateData = (dataMap, node, neighborNode, edge) => {
			if (!dataMap.get(node).has(neighborNode)) {
				dataMap.get(node).set(neighborNode, { id: neighborNode, edges: [], weight: 0 })
			}
			const aggregateObject = dataMap.get(node).get(neighborNode)
			aggregateObject.edges.push(edge)
			aggregateObject.weight += edge.weight ? edge.weight : 1
		}
		this.allEdges.forEach(edge => {
			aggregateData(sourceToTargetLookup, edge.sourceNode, edge.targetNode, edge)
			aggregateData(targetToSourceLookup, edge.targetNode, edge.sourceNode, edge)
			aggregateData(nodeToNeighborsLookup, edge.sourceNode, edge.targetNode, edge)
			if (edge.sourceNode !== edge.targetNode) aggregateData(nodeToNeighborsLookup, edge.targetNode, edge.sourceNode, edge)
		})
		//In the next step we flatten the structure from the aggregate maps we've constructed
		this.sourceToTargetMap = new Map(this.allNodes.map(node => [node, []]))
		this.targetToSourceMap = new Map(this.allNodes.map(node => [node, []]))
		this.nodeToNeighborsMap = new Map(this.allNodes.map(node => [node, []]))
		const flatten = (flatMap, structuredMap) => {
			for (const [nodeID, neighborMap] of structuredMap) {
				flatMap.set(nodeID, Array.from(neighborMap.values()))
			}
		}
		flatten(this.sourceToTargetMap, sourceToTargetLookup)
		flatten(this.targetToSourceMap, targetToSourceLookup)
		flatten(this.nodeToNeighborsMap, nodeToNeighborsLookup)
		this.updateMetaData()
	}

	/**
	 * Updates all edge meta data structures.
	 */
	updateMetaData() {
		this.edgeIndexes = new Map()
		const edgeMap = new Map()
		let edge
		const onlineEdges = this.getOnlineEdges()
		for (let i = 0; i < onlineEdges.length; i++) {
			edge = onlineEdges[i]
			const ID = edge.sourceNode > edge.targetNode ? `${edge.sourceNode}${edge.targetNode}` : `${edge.targetNode}${edge.sourceNode}`
			if (!edgeMap.has(ID)) {
				edgeMap.set(ID, [edge])
				continue
			}
			edgeMap.get(ID).push(edge)
		}
		for (const [, edgeArray] of edgeMap) {
			for (let i = 0; i < edgeArray.length; i++) {
				edge = edgeArray[i]
				this.edgeIndexes.set(edge, { total: edgeArray.length, index: i })
			}
		}
		this.offlineEdgeCounter = new Map(this.allNodes.map(node => [node, { sourceNode: 0, targetNode: 0, internal: 0 }]))
		const offlineEdges = this.getOfflineEdges()
		for (let i = 0; i < offlineEdges.length; i++) {
			edge = offlineEdges[i]
			if (edge.sourceNode === edge.targetNode) {
				this.offlineEdgeCounter.get(edge.sourceNode).internal++
			} else {
				this.offlineEdgeCounter.get(edge.sourceNode).sourceNode++
				this.offlineEdgeCounter.get(edge.targetNode).targetNode++
			}
		}
	}

	/**
	 * Computes online nodes
	 * @returns {import("./model/ibasicnode").IBasicNode[]} node
	 */
	getOnlineNodes() {
		return this.allNodes.filter(nodeID => this.onlineNodes.has(nodeID)).map(nodeID => this.nodeLookupMap.get(nodeID))
	}

	/**
	 * Computes offline nodes
	 * @returns {import("./model/ibasicnode").IBasicNode[]} node
	 */
	getOfflineNodes() {
		return this.allNodes.filter(nodeID => !this.onlineNodes.has(nodeID)).map(nodeID => this.nodeLookupMap.get(nodeID))
	}

	/**
	 * Computes online edges
	 * @returns {import("./model/ibasicedge").IBasicEdge[]} edge
	 */
	getOnlineEdges() {
		return this.allEdges.filter(edge => this.isEdgeOnline(edge))
	}

	/**
	 * Computes offline edges
	 * @returns {import("./model/ibasicedge").IBasicEdge[]} edge
	 */
	getOfflineEdges() {
		return this.allEdges.filter(edge => !this.isEdgeOnline(edge))
	}

	/**
	 * Checks if an edge is online
	 * @param {import("./model/ibasicnode").IBasicEdge} edge
	 * @returns {boolean}
	 */
	isEdgeOnline(edge) {
		return this.onlineNodes.has(edge.sourceNode) && this.onlineNodes.has(edge.targetNode)
	}

	/**
	 * Checks if a node is online
	 * @param {string} nodeID
	 * @returns {boolean}
	 */
	isNodeOnline(nodeID) {
		return this.onlineNodes.has(nodeID)
	}

	/**
	 * Brings the list of node IDs offline
	 * @param {import("./model/nodeid").NodeID[]} nodeIDs
	 */
	bringNodesOffline(nodeIDs) {
		nodeIDs.forEach(id => {
			this.onlineNodes.delete(id)
		})
		this.updateMetaData()
	}

	/**
	 * Brings the list of node IDs online
	 * @param {import("./model/nodeid").NodeID[]} nodeIDs
	 */
	bringNodesOnline(nodeIDs) {
		nodeIDs.forEach(id => {
			if (!this.nodeLookupMap.has(id)) {
				throw new Error(`No such node exists: ${id}`)
			}
			this.onlineNodes.add(id)
		})
		this.updateMetaData()
	}

	bringAllNodesOffline() {
		this.onlineNodes = new Set()
		this.updateMetaData()
	}

	bringAllNodesOnline() {
		this.onlineNodes = new Set(this.allNodes)
		this.updateMetaData()
	}

	/**
	 * Retrieves all neighbors for a given nodeID
	 * @param {import("./model/nodeid").NodeID} nodeID - ID od the node neighbors should be retrieved for
	 * @param {boolean} isDirected - Only traverse edges where the input node is the sourceNode
	 * @param {boolean} useOnlyOnline - Only traverse neighbors that are online
	 * @param {boolean} ignoreInternalEdges - Ignore self-edges
	 * @returns {import("./model/nodeid").NodeID[]}
	 */
	getNeighbors(nodeID, isDirected = false, useOnlyOnline = true, ignoreInternalEdges = true) {
		let neighbors
		if (isDirected) neighbors = this.sourceToTargetMap.get(nodeID).map(neighbor => neighbor.id)
		else neighbors = this.nodeToNeighborsMap.get(nodeID).map(neighbor => neighbor.id)
		if (useOnlyOnline) neighbors = neighbors.filter(neighbor => this.onlineNodes.has(neighbor))
		if (ignoreInternalEdges) neighbors = neighbors.filter(neighbor => neighbor !== nodeID)
		return Array.from(new Set(neighbors))
	}

	/**
	 * Computes collateral nodes in implodes or explode operations from a root node (I.e. bringing connected neighbors online/offline)
	 * This function will not apply any changes, but return an array with affected nodes
	 * The function exists specifically to help applications that implement implode/explode functionality in graphs
	 * and need to compute what nodes should be brough online/offline.
	 * @param {import("./model/nodeid").NodeID} nodeID
	 * @param {boolean} isBringOnline - If true neighbors will be brought online otherwise offline
	 * @param {boolean} isDirected - If true then operation will be directed
	 * @param {"single"|"recursive"|"leafs"} mode - Single means all neighbors are affected, leafs means only neighbors with no other neighbors are affected, recursive means neighbors recursively are affected.
	 * @returns {import("./model/nodeid").NodeID[]} - Affected nodes
	 */
	computeImplodeOrExplodeNode(nodeID, isBringOnline = false, isDirected = true, mode = "single") {
		if (!this.nodeLookupMap.has(nodeID)) {
			throw new Error(`No such node exists: ${nodeID}`)
		}
		if (!this.onlineNodes.has(nodeID)) {
			throw new Error(`Input node is offline: ${nodeID}`)
		}

		const neighborComputationCache = new Map()
		const getValidNeighborsForNode = nodeID => {
			if (neighborComputationCache.has(nodeID)) {
				return neighborComputationCache.get(nodeID)
			}
			const neighbors = this.getNeighbors(nodeID, isDirected, isBringOnline ? false : true, true)
			neighborComputationCache.set(nodeID, neighbors)
			return neighbors
		}

		const affectedNodes = []
		const processedNodes = new Set()
		const nodeLevels = new Map([[nodeID, 0]])
		let nodeQueue = [nodeID]
		let currentNode
		while ((currentNode = nodeQueue.pop())) {
			if (processedNodes.has(currentNode)) continue
			processedNodes.add(currentNode)
			if (mode === "single" && nodeLevels.get(currentNode) > 1) continue
			if (currentNode !== nodeID) affectedNodes.push(currentNode)
			const neighbors = getValidNeighborsForNode(currentNode)
			for (let i = 0; i < neighbors.length; i++) {
				const neighbor = neighbors[i]
				if (!nodeLevels.has(neighbor)) nodeLevels.set(neighbor, nodeLevels.get(currentNode) + 1)
			}
			if (mode === "leafs") {
				for (let i = 0; i < neighbors.length; i++) {
					const neighbor = neighbors[i]
					const neighborsNeighbors = getValidNeighborsForNode(neighbor).filter(neighborsNeighbor => neighborsNeighbor !== currentNode)
					if (neighborsNeighbors.length === 0) nodeQueue.push(neighbor)
				}
			} else {
				nodeQueue = nodeQueue.concat(neighbors)
			}
		}
		return affectedNodes.filter(node => (isBringOnline && !this.onlineNodes.has(node)) || (!isBringOnline && this.onlineNodes.has(node)))
	}

	/**
	 * Specifically meant to support renderers in determining optimal target positions for nodes that are being brough online.
	 * Accepts an array of node IDs and origin coordinates where the nodes should be animated from.
	 * Returns an array of vertices with optimal positions based on other neighbors present in the graph, or in the case of leafs a circle around the origin.
	 * Note(!) that this function expects all nodes and edges to have been initialized into GraphNodes and GraphEdges in order to compute this information.
	 * @param {import("./model/nodeid").NodeID[]} nodeIDs - Array of node IDs
	 * @param {number} distance - Default distance from origin position to put nodes (for non-average values only!)
	 * @param {number} originX - Start position for the transition
	 * @param {number} originY - Start position for the transition
	 * @returns {{id: import("./model/nodeid").NodeID, x: number, y: numer}[]} - Target coordinates
	 */
	stageNodePositions(nodeIDs = [], distance = 300, originX = 0, originY = 0) {
		if (!nodeIDs.length) return []
		const seenOriginNodes = []
		const numberOfLeafNodes = nodeIDs.filter(nodeID => this.getNeighbors(nodeID, false, true, true).length < 2).length
		return nodeIDs.map(nodeID => {
			const neighbors = this.getNeighbors(nodeID, false, true, true)
			if (neighbors.length < 2) {
				seenOriginNodes.push(nodeID)
				const multiplier = seenOriginNodes.length
				const divider = numberOfLeafNodes
				const angle = Math.floor((359 / divider) * multiplier)
				//+1 is to avoid divisional errors
				return {
					id: nodeID,
					x: originX + 1 + distance * Math.cos((angle * Math.PI) / 180),
					y: originY + 1 + distance * Math.sin((angle * Math.PI) / 180)
				}
			} else {
				//We are disregarding the weights of the neighbors. Should maybe be taken into account?
				let x = 0
				let y = 0
				for (let i = 0; i < neighbors.length; i++) {
					const neighbor = this.nodeLookupMap.get(neighbors[i])
					x += neighbor.x
					y += neighbor.y
				}
				x /= neighbors.length
				y /= neighbors.length
				return { id: nodeID, x, y }
			}
		})
	}

	/**
	 * Computes the shortest path from one node to another. Returns an array with the nodeIDs, or null if there is no path.
	 * @param {import("./model/nodeid").NodeID} startNode - Node ID where the road starts
	 * @param {import("./model/nodeid").NodeID} endNode - Node ID where the road ends
	 * @param {boolean} useOnlyOnline - If true the shortest path will only be computed for live nodes
	 * @param {boolean} isDirected - If true then operation will be directed
	 * @return {import("./model/nodeid").NodeID[]} - Array of node IDs from startnode to endnode containing the (a) shortest path
	 */
	findShortestPathUnweighted(startNode, endNode, useOnlyOnline = true, isDirected = true) {
		if (useOnlyOnline && (!this.onlineNodes.has(startNode) || !this.onlineNodes.has(endNode))) {
			throw new Error("Start node or end node is not live.")
		}
		if (startNode === endNode) {
			return [startNode]
		}
		const toProcess = [startNode]
		const cameFrom = new Map()
		let nextNode
		while ((nextNode = toProcess.pop())) {
			if (nextNode === endNode) break
			const candidates = this.getNeighbors(nextNode, isDirected, useOnlyOnline)
			let candidate
			for (let i = 0; i < candidates.length; i++) {
				candidate = candidates[i]
				if (useOnlyOnline && !this.onlineNodes.has(candidate)) continue
				if (cameFrom.has(candidate)) continue
				cameFrom.set(candidate, nextNode)
				toProcess.push(candidate)
			}
		}
		if (nextNode !== endNode) {
			return null
		}
		let step = nextNode
		const path = [step]
		while ((step = cameFrom.get(step))) {
			path.push(step)
		}
		return path.reverse()
	}

	/**
	 * Computes the shortest path from one node to another. Returns an array with the nodeIDs, or null if there is no path.
	 * This is basically Dijkstra's algorithm:
	 * https://en.wikipedia.org/wiki/Dijkstra's_algorithm
	 * @param {import("./model/nodeid").NodeID} startNode - Node ID where the road starts
	 * @param {import("./model/nodeid").NodeID} endNode - Node ID where the road ends
	 * @param {boolean} useOnlyOnline - If true the shortest path will only be computed for live nodes
	 * @param {boolean} isDirected - If true then operation will be directed
	 * @param {boolean} aggregateEdgeWeights - If true then weights for all edges between a set of nodes are aggregated and treated as a single edge
	 * @return {{id: import("./model/nodeid").NodeID, cost: number}[]} - Array of nodes and costs from startnode to endnode containing the (a) cheapest path
	 */
	findShortestPathWeighted(startNode, endNode, useOnlyOnline = true, isDirected = true, aggregateEdgeWeights = false) {
		if (useOnlyOnline && (!this.onlineNodes.has(startNode) || !this.onlineNodes.has(endNode))) {
			throw new Error("Start node or end node is not live.")
		}
		if (startNode === endNode) {
			return [{ id: startNode, cost: 0 }]
		}
		const getNeighborsWithWeights = nodeID => {
			let allNeighbors = isDirected ? this.sourceToTargetMap.get(nodeID) : this.nodeToNeighborsMap.get(nodeID)
			if (useOnlyOnline) allNeighbors = allNeighbors.filter(neighbor => this.onlineNodes.has(neighbor.id))
			allNeighbors = allNeighbors.filter(neighbor => neighbor.id !== nodeID)
			if (!aggregateEdgeWeights) {
				allNeighbors = allNeighbors.map(neighbor => {
					const cheapestEdge = neighbor.edges.reduce(
						(cheapest, edge) => {
							const weight = edge.weight ? edge.weight : 1
							return weight < cheapest.weight ? edge : cheapest
						},
						{ id: null, edges: [], weight: Infinity }
					)
					const newNeighbor = {
						id: neighbor.id,
						edges: [cheapestEdge],
						weight: cheapestEdge.weight ? cheapestEdge.weight : 1
					}
					return newNeighbor
				})
			}
			return allNeighbors
		}
		const cameFrom = new Map()
		const weightMap = new Map([[startNode, 0]])
		const nextNodes = [startNode]
		const processedNodes = new Set()
		let finalCost = null
		let currentNode = null
		while ((currentNode = nextNodes.pop())) {
			if (processedNodes.has(currentNode)) continue
			processedNodes.add(currentNode)
			const currentNodeWeight = weightMap.get(currentNode)
			const neighbors = getNeighborsWithWeights(currentNode)
			for (let i = 0; i < neighbors.length; i++) {
				const neighbor = neighbors[i]
				const currentWeight = weightMap.has(neighbor.id) ? weightMap.get(neighbor.id) : Infinity
				const newWeight = currentNodeWeight + neighbor.weight
				if (finalCost && newWeight > finalCost) continue
				if (newWeight < currentWeight) {
					weightMap.set(neighbor.id, newWeight)
					cameFrom.set(neighbor.id, currentNode)
				}
				if (neighbor.id === endNode) {
					finalCost = weightMap.get(endNode)
					continue
				}
				if (!processedNodes.has(neighbor.id)) nextNodes.push(neighbor.id)
			}
		}
		if (finalCost === null) return null
		let step = endNode
		const path = [{ id: endNode, weight: finalCost }]
		while ((step = cameFrom.get(step))) {
			path.push({ id: step, weight: weightMap.get(step) })
		}
		return path.reverse()
	}

	/**
	 * Computes strongly connected components in the graph.
	 * Basically an implementation of Kosoraju's algorithm.
	 * https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm
	 * @param {boolean} useOnlyOnline - If true the shortest path will only be computed for live nodes
	 * @return {("./model/nodeid").NodeID[][]} - Strongly connected components.
	 */
	computeStronglyConnectedComponents(useOnlyOnline = true) {
		const nodes = useOnlyOnline ? Array.from(this.onlineNodes) : [...this.allNodes]
		const stack = []
		const visited = new Set()
		//We will need to reverse the sourceToTarget neighbors in step 2 (DFS2)
		//It is significantly cheaper to do this during step 1 (DFS1) than computing it separately.
		const reversedNeighbors = new Map()
		const components = new Map()
		let numberOfComponents = 0
		const DFS1 = node => {
			if (visited.has(node)) return
			visited.add(node)
			const neighbors = this.getNeighbors(node, true, useOnlyOnline, true)
			for (let j = 0; j < neighbors.length; j++) {
				const neighbor = neighbors[j]
				if (!reversedNeighbors.has(neighbor)) reversedNeighbors.set(neighbor, [])
				reversedNeighbors.get(neighbor).push(node)
				DFS1(neighbor)
			}
			stack.push(node)
		}
		const DFS2 = node => {
			visited.add(node)
			if (!components.has(numberOfComponents)) {
				components.set(numberOfComponents, [])
			}
			components.get(numberOfComponents).push(node)
			if (reversedNeighbors.has(node)) {
				const reversedNeighborsOfNode = reversedNeighbors.get(node)
				for (let i = 0; i < reversedNeighborsOfNode.length; i++) {
					const reversedNeighbor = reversedNeighborsOfNode[i]
					if (!visited.has(reversedNeighbor)) DFS2(reversedNeighbor)
				}
			}
		}
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]
			DFS1(node)
		}
		visited.clear()
		while (stack.length) {
			const node = stack.pop()
			if (!visited.has(node)) {
				DFS2(node)
				numberOfComponents++
			}
		}
		return Array.from(components.values())
	}

	/**
	 * Executes a breadth-first search in the graph given a start node.
	 * Each node encountered will be handed off to a callback function provided,
	 * If the callback function returns true then that branch will be terminated.
	 * @param {import("./model/nodeid").NodeID} startNode
	 * @param {(import("./model/nodeid").NodeID) => void|true} callback
	 * @param {boolean} useOnlyOnline - If true only online nodes will be processed
	 * @param {boolean} isDirected - If true then traversal will be directed
	 */
	BFS(startNode, callback, useOnlyOnline = true, isDirected = true) {
		if (!this.nodeLookupMap.has(startNode)) {
			throw new Error(`No such node exists: ${startNode}`)
		}
		if (useOnlyOnline && !this.onlineNodes.has(startNode)) {
			throw new Error(`Input node is offline: ${startNode}`)
		}
		const seenNodes = new Set()
		let nextLevel = [startNode]
		let currentLevel = []
		let currentNode = null
		do {
			currentLevel = nextLevel.reverse()
			nextLevel = []
			while ((currentNode = currentLevel.pop())) {
				if (seenNodes.has(currentNode)) continue
				seenNodes.add(currentNode)
				if (callback(currentNode)) continue
				let neighbors
				if (isDirected) neighbors = this.sourceToTargetMap.get(currentNode).map(neighbor => neighbor.id)
				else neighbors = this.nodeToNeighborsMap.get(currentNode).map(neighbor => neighbor.id)
				nextLevel = nextLevel.concat(useOnlyOnline ? neighbors.filter(neighbor => this.onlineNodes.has(neighbor)) : neighbors)
			}
		} while (nextLevel.length)
	}

	/**
	 * Executes a depth-first search in the graph given a start node.
	 * Each node encountered will be handed off to a callback function provided,
	 * If the callback function returns true then that branch will be terminated.
	 * @param {import("./model/nodeid").NodeID} startNode
	 * @param {(import("./model/nodeid").NodeID) => void|true} callback
	 * @param {boolean} useOnlyOnline - If true only online nodes will be processed
	 * @param {boolean} isDirected - If true then traversal will be directed
	 */
	DFS(startNode, callback, useOnlyOnline = true, isDirected = true) {
		if (!this.nodeLookupMap.has(startNode)) {
			throw new Error(`No such node exists: ${startNode}`)
		}
		if (useOnlyOnline && !this.onlineNodes.has(startNode)) {
			throw new Error(`Input node is offline: ${startNode}`)
		}
		const seenNodes = new Set()
		let executionList = []
		let currentNode = startNode
		do {
			if (seenNodes.has(currentNode)) continue
			seenNodes.add(currentNode)
			if (callback(currentNode)) continue
			let neighbors
			if (isDirected) neighbors = this.sourceToTargetMap.get(currentNode).map(neighbor => neighbor.id)
			else neighbors = this.nodeToNeighborsMap.get(currentNode).map(neighbor => neighbor.id)
			executionList = executionList.concat(useOnlyOnline ? neighbors.filter(neighbor => this.onlineNodes.has(neighbor)).reverse() : neighbors.reverse())
		} while ((currentNode = executionList.pop()))
	}
}
