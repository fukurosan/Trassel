/**
 * Takes an acyclic(!) graph as input and returns nodes sorted by level from first source to last target.
 * Also returns a second array containing "fake" nodes that connect the different layers.
 * E.g. if node A in level 1 connects directly to node B in level 4 then the fake hierarchy will contain intermediary nodes.
 * @param {import("../../model/ibasicnode").IBasicNode[]} nodes
 * @param {import("../../model/ibasicedge").IBasicEdge[]} edges
 * @returns {{hierarchy: import("../../model/ibasicnode").IBasicNode[][], fakeNodesHierarchy: import("../../model/ibasicnode").IBasicNode[][] fakeEdges: import("../../model/ibasicedge").IBasicEdge[]}} - Level array of nodes
 */
export const determineLevels = (nodes, edges) => {
	const incomingEdges = new Map(nodes.map(node => [node.id, edges.filter(edge => edge.targetNode === node.id)]))
	const outgoingEdges = new Map(nodes.map(node => [node.id, edges.filter(edge => edge.sourceNode === node.id)]))

	//Compute y coordinate for a node. This is the same as "level", but makes the variables more readable.
	//Islands are reserved on level 0, and sources start at level 1. Generally this results in a more readable layout.
	const sources = nodes.filter(node => !incomingEdges.get(node.id).length && outgoingEdges.get(node.id).length)
	const islands = nodes.filter(node => !incomingEdges.get(node.id).length && !outgoingEdges.get(node.id).length)
	const yCoordinates = new Map([...islands.map(node => [node.id, 0]), ...sources.map(node => [node.id, 1])])
	const getYCoordinate = nodeID => {
		if (!yCoordinates.has(nodeID)) {
			const maxLevelSource = Math.max(...incomingEdges.get(nodeID).map(edge => getYCoordinate(edge.sourceNode)))
			yCoordinates.set(nodeID, maxLevelSource + 1)
		}
		return yCoordinates.get(nodeID)
	}

	//Assign all nodes to levels
	const levels = new Map()
	for (let i = 0; i < nodes.length; i++) {
		const level = getYCoordinate(nodes[i].id)
		if (!levels.has(level)) {
			levels.set(level, [])
		}
		levels.get(level).push(nodes[i])
	}
	const nodesByLevel = Array.from(levels.keys())
		.sort((a, b) => a - b)
		.map(key => levels.get(key))

	//Compute fake nodes
	const fakeNodesByLevel = nodesByLevel.map(() => [])
	const fakeEdgeArray = []
	const createdNodes = new Set()
	for (let i = 0; i < nodes.length; i++) {
		const nodeID = nodes[i].id
		const nodeYLevel = getYCoordinate(nodeID)
		const sourceNodes = incomingEdges.get(nodeID).map(edge => edge.sourceNode)
		for (let j = 0; j < sourceNodes.length; j++) {
			const sourceNodeID = sourceNodes[j]
			const sourceYLevel = getYCoordinate(sourceNodeID)
			const diff = nodeYLevel - sourceYLevel
			if (diff > 1) {
				let nextSourceNodeID = sourceNodeID
				for (let z = sourceYLevel + 1; z < nodeYLevel; z++) {
					const fakeNodeID = "__FAKE_NODE__" + z + nodeID + nextSourceNodeID
					if (!createdNodes.has(fakeNodeID)) {
						//There can be nodes with multiple connections between each other. These should result in a single fake vertex.
						createdNodes.add(fakeNodeID)
						const fakeNode = { id: fakeNodeID }
						fakeNodesByLevel[z - 1].push(fakeNode) //We need -1 because islands are reserved for level 0
					}
					fakeEdgeArray.push({ sourceNode: nextSourceNodeID, targetNode: fakeNodeID })
					nextSourceNodeID = fakeNodeID
				}
				fakeEdgeArray.push({ sourceNode: nextSourceNodeID, targetNode: nodeID })
			}
		}
	}
	return {
		hierarchy: nodesByLevel,
		fakeNodesHierarchy: fakeNodesByLevel,
		fakeEdges: fakeEdgeArray
	}
}
