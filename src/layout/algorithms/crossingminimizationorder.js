/**
 * Takes a leveled hierarchy graph and reorders the contained nodes to an optimal position with minimized edge crossings.
 * If a fake hierarchy is provided null values will be inserted into the resulting order.
 * Solution is partially inspired by the "Hungarian Method" for maximization
 * Note that this solution is *not* suitable for large graphs
 * @param {import("../../model/ibasicnode").IBasicNode[][]} hierarchyIn
 * @param {import("../../model/ibasicedge").IBasicEdge[]} edges
 * @returns {import("../../model/ibasicnode").IBasicNode[][]} - Ordered Hierarchy
 */
export const crossingMinimizationOrder = (hierarchyIn, edges) => {
	let hierarchy = hierarchyIn.reduce((acc, group) => {
		acc.push([...group])
		return acc
	}, [])

	if (hierarchy.length === 1) {
		return hierarchy
	}

	//Only edges that go between two adjacent levels should be included
	const nodeLevelMap = new Map()
	const nodeIndexInLevel = new Map()
	hierarchy.forEach((level, levelIndex) => {
		level.forEach((node, nodeIndex) => {
			nodeLevelMap.set(node.id, levelIndex)
			nodeIndexInLevel.set(node.id, nodeIndex)
		})
	})
	const filteredEdges = edges.filter(edge => {
		const sourceLevel = nodeLevelMap.get(edge.sourceNode)
		const targetLevel = nodeLevelMap.get(edge.targetNode)
		if (sourceLevel === targetLevel - 1) {
			return true
		}
		return false
	})

	//The index of the nodes in the hierarchy will change during ordering. We need to keep track of this
	const updateNodeIndexForLevel = level => {
		level.forEach((node, nodeIndex) => {
			nodeIndexInLevel.set(node.id, nodeIndex)
		})
	}
	const findNodeIndexInLevel = nodeID => {
		return nodeIndexInLevel.get(nodeID)
	}

	//When it has been determined what node is most likely to need to lie to the left we can recursively check if any other node is better suited
	//This is necessary because the initial "optimal" node is just an approximation
	const findLeftOptimality = (index, matrix) => {
		let optimalIndex = index
		let depth = 0
		while (true) {
			const foundLeftSums = matrix.map(row => (row.sum[optimalIndex] > 0 ? row.sum[optimalIndex] : 0))
			const maxIndex = foundLeftSums.indexOf(Math.max(...foundLeftSums))
			if (foundLeftSums[maxIndex] !== 0) {
				optimalIndex = maxIndex
				depth++
				if (depth > 9999) {
					//This will be as near optimal as it gets.
					break
				}
				continue
			}
			break
		}
		return optimalIndex
	}

	//Order scan is from start level to end level
	//Reverse is when we go from top to bottom rather than bottom to top
	//This loop could probably be made faster in the future.
	const orderHierarchyLevels = (hierarchyToProcess, isReverse = false) => {
		hierarchyToProcess.forEach((level, levelIndex) => {
			const nodeSourceIndexMap = new Map(level.map(node => [node.id, []]))
			filteredEdges.forEach(edge => {
				if (!isReverse && nodeSourceIndexMap.has(edge.targetNode)) {
					nodeSourceIndexMap.get(edge.targetNode).push(findNodeIndexInLevel(edge.sourceNode))
				} else if (isReverse && nodeSourceIndexMap.has(edge.sourceNode)) {
					nodeSourceIndexMap.get(edge.sourceNode).push(findNodeIndexInLevel(edge.targetNode))
				}
			})
			const matrix = level.map(node => {
				const nodeSourceIndexes = nodeSourceIndexMap.get(node.id)
				return {
					node,
					sum: level.map(neighbourNode => {
						if (neighbourNode.id === node.id) {
							return 0
						}
						const neighbourSourceIndexes = nodeSourceIndexMap.get(neighbourNode.id)
						//These parameters describe the penalty of being to the left / right of the neighbour in terms of crossings
						let nodeIsToTheLeft = 0
						let nodeIsToTheRight = 0
						nodeSourceIndexes.forEach(nodeIndex => {
							neighbourSourceIndexes.forEach(neighbourIndex => {
								nodeIndex < neighbourIndex && nodeIsToTheRight++
								nodeIndex > neighbourIndex && nodeIsToTheLeft++
							})
						})
						//This result represents how many *less* crossings there will be if the node is to the left of its neighbour
						//I.e. A higher number means it is better to the left
						return nodeIsToTheRight - nodeIsToTheLeft
					})
				}
			})
			const newOrder = []
			const orderLength = matrix.length
			for (let i = 0; i < orderLength; i++) {
				const sums = matrix.map(row => row.sum.reduce((acc, cell) => acc + cell, 0))
				const indexToSplit = findLeftOptimality(sums.indexOf(Math.max(...sums)), matrix)
				newOrder.push(matrix[indexToSplit].node)
				matrix.forEach(row => {
					row.sum.splice(indexToSplit, 1) //Remove the column
				})
				matrix.splice(indexToSplit, 1) //Remove the row
			}
			updateNodeIndexForLevel(newOrder)
			hierarchyToProcess[levelIndex] = newOrder
		})
		return hierarchyToProcess
	}

	//We sweep bottom to top and then top to bottom
	//A case could be made for repeating the process until an optimal layout is found. A single pass usually gives an OK result though.
	for (let i = 0; i < 1; i++) {
		hierarchy = orderHierarchyLevels(orderHierarchyLevels(hierarchy).reverse(), true).reverse()
	}
	//Initial reactions suggest that doing a bottom to top scan last gives a generally slightly nicer result.
	hierarchy = orderHierarchyLevels(hierarchy)

	return hierarchy
}
