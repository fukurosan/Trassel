/**
 * Takes a leveled hierarchy graph and inserts null values to position nodes close to its targets and sources.
 * If a node has the substring "fake" in its id then it will be converted into a null value in the input
 * @param {import("../../model/ibasicnode").IBasicNode[][]} fullHierarchyIn
 * @param {import("../../model/ibasicedge").IBasicEdge[]} edgesIn
 * @returns {(import("../../model/ibasicnode").IBasicNode | null)[][]|} - Ordered Hierarchy
 */
export const straightenEdges = (fullHierarchyIn, edgesIn) => {
	const fullHierarchy = fullHierarchyIn.reduce((acc, group) => {
		acc.push([...group])
		return acc
	}, [])

	//Prepare the data
	const nodeLevelMap = new Map()
	fullHierarchy.forEach((level, levelIndex) => {
		level.forEach(node => {
			nodeLevelMap.set(node.id, levelIndex)
		})
	})
	const nodeIndexInLevel = new Map()
	const findNodeIndexInLevel = nodeID => {
		return nodeIndexInLevel.get(nodeID)
	}
	const reComputeLevelIndexes = levelIndex => {
		fullHierarchy[levelIndex].forEach((node, nodeIndex) => {
			if (node !== null) {
				nodeIndexInLevel.set(node.id, nodeIndex)
			}
		})
	}
	const edges = edgesIn.filter(edge => {
		const sourceLevel = nodeLevelMap.get(edge.sourceNode)
		const targetLevel = nodeLevelMap.get(edge.targetNode)
		if (sourceLevel === targetLevel - 1) {
			return true
		}
		return false
	})

	//Fill in space with null values to make sure all hierarchy levels are of equal width
	//Store the original width since we need this to determine if a node should move based on its sources or based on its targets
	const levelLengthMap = new Map()
	const maxRows = Math.max(...fullHierarchy.map(level => level.length))
	fullHierarchy.forEach((level, levelIndex) => {
		levelLengthMap.set(levelIndex, level.length)
		if (level.length < maxRows) {
			let isPush = false
			for (let i = level.length; i < maxRows; i++) {
				if (isPush) level.push(null)
				else level.unshift(null)
				isPush = !isPush
			}
		}
	})

	//To minimize bends we do what is essentially a form of barycenter heuristic.
	//Compute the average target or source distance for all edges for a given level
	const computeAverageIndexes = (level, isSource) => {
		const averageIndexes = new Map()
		level.forEach(node => {
			if (node === null) return
			const nodeShouldBe = isSource ? "sourceNode" : "targetNode"
			const connectingNodeShouldBe = isSource ? "targetNode" : "sourceNode"
			//Find the average index of all edges this connects to.
			let averageNodeIndex = [0, 0]
			edges.forEach(edge => {
				if (edge[nodeShouldBe] === node.id) {
					averageNodeIndex[0] += findNodeIndexInLevel(edge[connectingNodeShouldBe])
					averageNodeIndex[1] += 1
				}
			})
			averageNodeIndex = Math.floor(averageNodeIndex[0] / averageNodeIndex[1])
			averageIndexes.set(node.id, isNaN(averageNodeIndex) ? 0 : averageNodeIndex)
		})
		return averageIndexes
	}

	//Finally move edges within their space until an optimal layout has been found
	fullHierarchy.forEach((level, levelIndex) => {
		//Return if this is the max row level or if there is only one level in the hierarchy
		if (levelLengthMap.get(levelIndex) === maxRows) return
		else if (fullHierarchy.length === 1) return
		//Determine if we need to look at incoming edges or outgoing edges to optimize our position
		let nodeShouldbeSource
		if (levelIndex === 0) nodeShouldbeSource = true
		else if (levelIndex === fullHierarchy.length - 1) nodeShouldbeSource = false
		else if (levelLengthMap.get(levelIndex) > levelLengthMap.get(levelIndex - 1)) nodeShouldbeSource = true
		else nodeShouldbeSource = false
		//Recompute the necessary index maps
		reComputeLevelIndexes(levelIndex)
		reComputeLevelIndexes(nodeShouldbeSource ? levelIndex + 1 : levelIndex - 1)
		//Get the average indexes for the current level nodes
		const averageIndexes = computeAverageIndexes(level, nodeShouldbeSource)
		let didChange = true
		while (didChange === true) {
			didChange = false
			for (let nodeIndex = 0; nodeIndex < level.length; nodeIndex++) {
				const node = level[nodeIndex]
				if (node === null) continue
				const averageIndex = averageIndexes.get(node.id)
				const canMoveLeft = nodeIndex === 0 ? false : level[nodeIndex - 1] === null ? true : false
				const canMoveRight = nodeIndex === level.length - 1 ? false : level[nodeIndex + 1] === null ? true : false
				if (averageIndex > nodeIndex && canMoveRight) {
					level[nodeIndex + 1] = node
					level[nodeIndex] = null
					if (nodeIndex - 2 > -1) nodeIndex = nodeIndex - 2
					didChange = true
				} else if (averageIndex < nodeIndex && canMoveLeft) {
					level[nodeIndex - 1] = node
					level[nodeIndex] = null
					nodeIndex--
					didChange = true
				}
			}
		}
	})

	return fullHierarchy.map(level => level.map(node => (node && !`${node.id}`.toUpperCase().includes("FAKE") ? node : null))) //
}
