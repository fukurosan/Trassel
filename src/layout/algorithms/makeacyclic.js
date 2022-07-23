/**
 * Takes a graph as input and returns an acyclic array of edges.
 * Based on Eades, Lin, Smyth, '93
 * @param {import("../../model/ibasicnode").IBasicNode[]} nodes
 * @param {import("../../model/ibasicedge").IBasicEdge[]} edges
 * @returns {import("../../model/ibasicedge").IBasicEdge[]} - Acyclic array of edges
 */
export const makeAcyclic = (nodes, edges) => {
	const originalNodes = [...nodes]
	const originalEdges = edges.filter(edge => edge.targetNode !== edge.sourceNode)
	const incomingCount = new Map(originalNodes.map(node => [node.id, 0]))
	const outgoingCount = new Map(originalNodes.map(node => [node.id, 0]))
	originalEdges.forEach(edge => {
		incomingCount.set(edge.targetNode, incomingCount.get(edge.targetNode) + 1)
		outgoingCount.set(edge.sourceNode, outgoingCount.get(edge.sourceNode) + 1)
	})
	const resultingNodes = []
	const resultingEdges = []

	const findSinksOrSources = (isSource = false) => {
		while (true) {
			let hasChanged = false
			for (let i = 0; i < originalNodes.length; i++) {
				const node = originalNodes[i]
				if (
					(!isSource && !outgoingCount.get(node.id) && incomingCount.get(node.id)) ||
					(isSource && outgoingCount.get(node.id) && !incomingCount.get(node.id))
				) {
					hasChanged = true
					resultingNodes.push(originalNodes.splice(i, 1)[0])
					i--
					for (let j = 0; j < originalEdges.length; j++) {
						const edge = originalEdges[j]
						if ((!isSource && edge.targetNode === node.id) || (isSource && edge.sourceNode === node.id)) {
							outgoingCount.set(edge.sourceNode, outgoingCount.get(edge.sourceNode) - 1)
							incomingCount.set(edge.targetNode, incomingCount.get(edge.targetNode) - 1)
							resultingEdges.push(originalEdges.splice(j, 1)[0])
							j--
						}
					}
				}
			}
			if (hasChanged) {
				continue
			}
			break
		}
	}

	//Keep going until all nodes have been assigned into the result
	while (originalNodes.length) {
		//Find sinks
		findSinksOrSources(false)

		//Find all isolated nodes
		for (let i = 0; i < originalNodes.length; i++) {
			const node = originalNodes[i]
			if (!incomingCount.get(node.id) && !outgoingCount.get(node.id)) {
				originalNodes.splice(i, 1)
				resultingNodes.push(node)
				i--
			}
		}

		//Find sources
		findSinksOrSources(true)

		//If there are still edges, find the maximal value based on outgoing - incoming and add it but remove the outgoing edges.
		if (originalNodes.length) {
			const maximalNode = originalNodes.reduce(
				(acc, node, index) => {
					const value = outgoingCount.get(node.id) - incomingCount.get(node.id)
					if (value > acc[1]) {
						acc = [node, value, index]
					}
					return acc
				},
				[null, 0, -1]
			)
			if (maximalNode[0] === null) {
				//It was a stalemate, grab a random node
				maximalNode[0] = originalNodes[0]
				maximalNode[2] = 0
			}
			for (let i = 0; i < originalEdges.length; i++) {
				const edge = originalEdges[i]
				if (edge.sourceNode === maximalNode[0].id) {
					incomingCount.set(edge.targetNode, incomingCount.get(edge.targetNode) - 1)
					resultingEdges.push(edge)
					originalEdges.splice(i, 1)
					i--
				}
				if (edge.targetNode === maximalNode[0].id) {
					outgoingCount.set(edge.sourceNode, outgoingCount.get(edge.sourceNode) - 1)
					originalEdges.splice(i, 1)
					i--
				}
				resultingNodes.push(originalNodes.splice(maximalNode[2], 1)[0])
			}
		}
	}

	return resultingEdges
}
