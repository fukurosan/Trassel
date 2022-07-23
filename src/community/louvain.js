/**
 * Community detection using the Louvain algorithm.
 * This function takes a list of nodes and edges (data must be valid!) and computes community assignments
 * The function returns an array of arrays where each inner array represents a community populated by node IDs.
 * To read more about the Louvain community detection algorithm:
 * https://arxiv.org/pdf/0803.0476.pdf
 * https://medium.com/walmartglobaltech/demystifying-louvains-algorithm-and-its-implementation-in-gpu-9a07cdd3b010
 * @param {import("../model/igraphnode").IGraphNode[]} nodes
 * @param {import("../model/igraphedge").IGraphEdge[]} edges
 * @returns {{communities: import("../model/nodeid").NodeID[][], communityTable: {[key: string]: any}}}
 */
export default function (nodes, edges) {
	function removeDuplicates(array) {
		return Array.from(new Set(array))
	}

	function getEdgeWeight(graph, node1, node2) {
		return graph.associationMatrix[node1] ? graph.associationMatrix[node1][node2] : undefined
	}

	function deepCopy(obj) {
		if (obj === null || typeof obj !== "object") {
			return obj
		}
		const temp = obj.constructor()
		for (const key in obj) {
			temp[key] = deepCopy(obj[key])
		}
		return temp
	}

	function getModularity(graphProperties) {
		const communities = removeDuplicates(Object.values(graphProperties.nodesToCommunity))
		return communities.reduce((result, community) => {
			const internalDegree = graphProperties.totalCommunityWeights[community] || 0
			const degree = graphProperties.degrees[community] || 0
			if (graphProperties.totalWeight > 0) {
				result = result + internalDegree / graphProperties.totalWeight - Math.pow(degree / (2 * graphProperties.totalWeight), 2)
			}
			return result
		}, 0.0)
	}

	function reNumberPartition(nodesToCommunity) {
		let count = 0
		const reNumberedPartition = deepCopy(nodesToCommunity)
		const newValues = {}
		Object.keys(nodesToCommunity).forEach(key => {
			const value = nodesToCommunity[key]
			let newValue = typeof newValues[value] === "undefined" ? -1 : newValues[value]
			if (newValue === -1) {
				newValues[value] = count
				newValue = count
				count = count + 1
			}
			reNumberedPartition[key] = newValue
		})
		return reNumberedPartition
	}

	function computeNextLevel(graph, graphProperties) {
		let currentModularity
		let newModularity = getModularity(graphProperties)
		let hasModifiedCommunityMembers = true
		while (hasModifiedCommunityMembers) {
			currentModularity = newModularity
			hasModifiedCommunityMembers = false
			//For each node, try to find the optimal community assignment
			graph.nodes.forEach(node => {
				//Compute neighborhood meta data for the node
				const currentNodeCommunity = graphProperties.nodesToCommunity[node]
				const communityWeightByTotalWeight = (graphProperties.gdegrees[node] || 0) / (graphProperties.totalWeight * 2.0)
				const neighboringCommunities = {}
				const neighborhood = typeof graph.associationMatrix[node] === "undefined" ? [] : Object.keys(graph.associationMatrix[node])
				neighborhood.forEach(neighbor => {
					if (neighbor !== node) {
						const weight = graph.associationMatrix[node][neighbor]
						const neighborcommunity = graphProperties.nodesToCommunity[neighbor]
						neighboringCommunities[neighborcommunity] = (neighboringCommunities[neighborcommunity] || 0) + weight
					}
				})

				//Remove the node from its community
				const weight = neighboringCommunities[currentNodeCommunity] || 0
				graphProperties.degrees[currentNodeCommunity] = (graphProperties.degrees[currentNodeCommunity] || 0) - (graphProperties.gdegrees[node] || 0)
				graphProperties.totalCommunityWeights[currentNodeCommunity] =
					(graphProperties.totalCommunityWeights[currentNodeCommunity] || 0) - weight - (graphProperties.nodesLoopWeight[node] || 0)
				graphProperties.nodesToCommunity[node] = -1

				//Compute optimal community for the node
				let bestCommunity = currentNodeCommunity
				let bestIncrease = 0
				Object.keys(neighboringCommunities).forEach(community => {
					const increase = neighboringCommunities[community] - (graphProperties.degrees[community] || 0) * communityWeightByTotalWeight
					if (increase > bestIncrease) {
						bestIncrease = increase
						bestCommunity = community
					}
				})

				//Insert node into the newly computed community (could be the same as it was before!)
				graphProperties.nodesToCommunity[node] = +bestCommunity
				graphProperties.degrees[bestCommunity] = (graphProperties.degrees[bestCommunity] || 0) + (graphProperties.gdegrees[node] || 0)
				graphProperties.totalCommunityWeights[bestCommunity] =
					(graphProperties.totalCommunityWeights[bestCommunity] || 0) +
					(neighboringCommunities[bestCommunity] || 0) +
					(graphProperties.nodesLoopWeight[node] || 0)

				//Did we modify the community assignment?
				if (bestCommunity !== currentNodeCommunity) {
					hasModifiedCommunityMembers = true
				}
			})

			//Compute if the loop should keep going or if we reached an optimal modularity
			newModularity = getModularity(graphProperties)
			if (newModularity - currentModularity < 0.0000001) {
				//There is no difference, or it is insignificant
				break
			}
		}
	}

	function aggregateCommunities(partition, graph) {
		const partitionValues = Object.values(partition)
		const result = { nodes: removeDuplicates(partitionValues), edges: [], associationMatrix: {} }
		const edgeIndex = {}
		graph.edges.forEach(edge => {
			const weight = edge.weight
			const communityOne = partition[edge.sourceNode]
			const communityTwo = partition[edge.targetNode]
			const edgeWeight = getEdgeWeight(result, communityOne, communityTwo) || 0
			const newWeight = edgeWeight + weight
			const newEdge = { sourceNode: communityOne, targetNode: communityTwo, weight: newWeight }
			!result.associationMatrix[newEdge.sourceNode] && (result.associationMatrix[newEdge.sourceNode] = {})
			result.associationMatrix[newEdge.sourceNode][newEdge.targetNode] = newEdge.weight
			!result.associationMatrix[newEdge.targetNode] && (result.associationMatrix[newEdge.targetNode] = {})
			result.associationMatrix[newEdge.targetNode][newEdge.sourceNode] = newEdge.weight
			if (edgeIndex[newEdge.sourceNode + ":" + newEdge.targetNode]) {
				result.edges[edgeIndex[newEdge.sourceNode + ":" + newEdge.targetNode]].weight = newEdge.weight
			} else {
				result.edges.push(newEdge)
				edgeIndex[newEdge.sourceNode + ":" + newEdge.targetNode] = result.edges.length - 1
			}
		})
		return result
	}

	function partitionToCommunityList(nodeToCommunityMatrix) {
		const reversed = {}
		Object.keys(nodeToCommunityMatrix).forEach(node => {
			const community = nodeToCommunityMatrix[node]
			!reversed[community] && (reversed[community] = [])
			reversed[community].push(node)
		})
		return Object.values(reversed)
	}

	function computeGraphProperties(graph) {
		const graphProperties = {}
		//key: node, value: community
		graphProperties.nodesToCommunity = {}
		//key: community, value: total internal weight of community (loops)
		graphProperties.totalCommunityWeights = {}
		//key: community, value: total weight of incident edges
		graphProperties.degrees = {}
		//key: node, value: total weight of incident edges
		graphProperties.gdegrees = {}
		//key: node, value: total looping edges (pointing from the node into itself)
		graphProperties.nodesLoopWeight = {}
		//The full weight of all edges in the graph
		graphProperties.totalWeight = graph.edges.reduce((size, edge) => size + edge.weight, 0)
		graph.nodes.forEach((node, i) => {
			graphProperties.nodesToCommunity[node] = i
			const neighbors = graph.associationMatrix[node] ? Object.keys(graph.associationMatrix[node]) : []
			const totalNeighborWeight = neighbors.reduce((weight, neighbor) => {
				let value = graph.associationMatrix[node][neighbor]
				if (node === neighbor) {
					value *= 2
				}
				return weight + value
			}, 0)
			if (totalNeighborWeight < 0) {
				throw new Error("Communities cannot be computed with negative weights.")
			}
			graphProperties.degrees[i] = totalNeighborWeight
			graphProperties.gdegrees[node] = totalNeighborWeight
			graphProperties.nodesLoopWeight[node] = getEdgeWeight(graph, node, node) || 0
			graphProperties.totalCommunityWeights[i] = graphProperties.nodesLoopWeight[node]
		})
		return graphProperties
	}

	//------------------------------ Computation starts here ------------------------------
	const nodeIDs = nodes.map(node => node.id)
	const originalGraph = {
		nodes: nodeIDs,
		edges,
		associationMatrix: edges.reduce((matrix, edge) => {
			!matrix[edge.sourceNode] && (matrix[edge.sourceNode] = {})
			matrix[edge.sourceNode][edge.targetNode] = edge.weight
			!matrix[edge.targetNode] && (matrix[edge.targetNode] = {})
			matrix[edge.targetNode][edge.sourceNode] = edge.weight
			return matrix
		}, {})
	}

	//If there are no edges then each node is its own community
	if (originalGraph.edges.length === 0) {
		return {
			communities: originalGraph.nodes.map(node => [node.id]),
			communityTable: originalGraph.nodes.reduce((acc, node) => {
				acc[node.id] = node
				return acc
			}, {})
		}
	}

	const dendogram = []
	let modularity = -Infinity //This ensures that one initial run always completes
	let currentGraph = originalGraph
	while (true) {
		//Compute meta data about the current graph
		const graphProperties = computeGraphProperties(currentGraph)
		//Compute the next level of the dendogram (this will mutate graphProperties)
		computeNextLevel(currentGraph, graphProperties)
		//Confirm if we should keep going or stop here
		const newModularity = getModularity(graphProperties)
		if (newModularity - modularity < 0.0000001) {
			//Either there is no difference or the difference is insignificant
			break
		}
		//The partition is the same as nodesToCommunity, but with ordered numbers
		//e.g. 1, 2, 4 becomes 1, 2, 3
		const partition = reNumberPartition(graphProperties.nodesToCommunity)
		//Save this level of the dendogram
		dendogram.push(partition)
		modularity = newModularity
		//Compute a new graph based on the old graph and the partition
		currentGraph = aggregateCommunities(partition, currentGraph)
	}

	//Step through the dendogram to find the final assignment for all original nodes
	const resultPartition = deepCopy(dendogram[0])
	for (let i = 1; i < dendogram.length; i++) {
		Object.keys(resultPartition).forEach(key => {
			const node = key
			const community = resultPartition[key]
			resultPartition[node] = dendogram[i][community]
		})
	}
	return {
		communities: partitionToCommunityList(resultPartition),
		communityTable: resultPartition
	}
}
