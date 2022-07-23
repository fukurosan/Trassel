/**
 * Computes groups based on disjointed graphs within the graph.
 * @param {import("../../model/ibasicnode").IBasicNode[]} nodes - Nodes
 * @param {import("../../model/ibasicedge").IBasicEdge[]} edges - Edges
 * @returns {import("../../model/ibasicnode").IBasicNode[][]} - Disjointed node groups
 */
export default (nodes, edges) => {
	const seenNodes = new Set()
	const groups = new Map()
	const loopGroup = (nodeID, rootRepresentativeNodeID) => {
		if (seenNodes.has(nodeID)) {
			return
		}
		seenNodes.add(nodeID)
		let representativeNodeID
		if (!rootRepresentativeNodeID) {
			representativeNodeID = nodeID
			groups.set(nodeID, [nodeID])
		} else {
			representativeNodeID = rootRepresentativeNodeID
			groups.get(representativeNodeID).push(nodeID)
		}
		edges
			.filter(edge => edge.sourceNode !== edge.targetNode && (edge.sourceNode === nodeID || edge.targetNode === nodeID))
			.reduce((acc, edge) => {
				acc.push(edge.targetNode)
				acc.push(edge.sourceNode)
				return acc
			}, [])
			.forEach(nodeID => {
				loopGroup(nodeID, representativeNodeID)
			})
	}
	nodes.forEach(node => {
		loopGroup(node.id)
	})
	return [...groups.values()].map(cluster => cluster.map(nodeID => nodes.find(node => node.id === nodeID)))
}
