import disjointGroups from "./disjointgroups.js"

/**
 * Orders nodes by barycenter and returns a new array without mutating the original one.
 * Inspired by: http://profs.etsmtl.ca/mmcguffin/research/2012-mcguffin-simpleNetVis/mcguffin-2012-simpleNetVis.pdf
 * @param {import("../../model/ibasicnode.js").IBasicNode[]} nodes - Nodes
 * @param {import("../../model/ibasicedge.js").IBasicEdge[]} edges - Edges
 * @return {import("../../model/ibasicnode.js").IBasicNode[]} - Ordered nodes
 */
export default (nodes, edges) => {
	const edgeMap = new Map()
	nodes.forEach(node => edgeMap.set(node.id, []))
	edges.forEach(edge => {
		if (edge.sourceNode !== edge.targetNode) {
			edgeMap.get(edge.sourceNode).push(nodes.findIndex(targetNode => targetNode.id === edge.targetNode))
			edgeMap.get(edge.targetNode).push(nodes.findIndex(sourceNode => sourceNode.id === edge.sourceNode))
		}
	})
	return disjointGroups(nodes, edges)
		.map(group => {
			const orderedNodes = group.map((_, index) => ({ average: 0, index }))
			const findPosition = i => {
				return orderedNodes.findIndex(node => node.index === i)
			}
			for (let i = 0; i < group.length + 1; i++) {
				group.forEach((node, originalNodeIndex) => {
					const position1 = findPosition(originalNodeIndex)
					let sum = position1
					edgeMap.get(node.id).forEach(neighbor => {
						const position2 = findPosition(neighbor)
						sum += position2
					})
					orderedNodes[position1].average = sum / edgeMap.get(node.id).length + 1
				})
				orderedNodes.sort((a, b) => a.average - b.average)
			}
			return orderedNodes.map(orderedNode => group[orderedNode.index])
		})
		.flat()
}
