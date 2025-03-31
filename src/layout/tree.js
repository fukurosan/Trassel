import { determineLevels } from "./algorithms/determinelevels"
import { makeAcyclic } from "./algorithms/makeacyclic"
import LayoutComponent from "./layoutcomponent"

/**
 * Creates an tree component that sorts nodes on an axis (either y or x) based on the Reingold-Tilford algorithm
 * The algorithm has been modified slightly to allow for things like multiple root nodes, centering in a coordinate system, and varying node sizes.
 * @param {boolean=} isVerticalLayout - If true the tree will be top to bottom, otherwise it will be left to right
 * @param {number=} padding - Minimum padding between nodes described in pixels
 * @param {number=} centerX - Center X coordinate of the component
 * @param {number=} centerY - Center Y coordinate of the component
 */
export default class Tree extends LayoutComponent {
	constructor(isVerticalLayout = true, padding = 100, centerX = null, centerY = null) {
		super()
		this.isVerticalLayout = isVerticalLayout
		this.PADDING_PX = padding
		this.centerX = centerX
		this.centerY = centerY
		this.nodePositions = new Map()
	}

	/**
	 * @param {import("../model/nodesandedges").LayoutNode} node
	 */
	getWidth(node) {
		return node.shape.width ? node.shape.width : node.shape.radius * 2
	}

	/**
	 * @param {import("../model/nodesandedges").LayoutNode} node
	 */
	getHeight(node) {
		return node.shape.height ? node.shape.height : node.shape.radius * 2
	}

	initialize(...args) {
		super.initialize(...args)
		//Compute acyclic hierarchy
		const acyclicEdges = makeAcyclic(this.nodes, this.edges)
		const { hierarchy } = determineLevels([...this.nodes, { id: "FAKE__ISLAND" }], acyclicEdges)
		//This is just because of how the determineLevels function works.
		//If there are island nodes then these will all be placed in the top level, with the tree starting in the second level.
		//This won't work with this algorithm since it assumes the structure is a tree
		hierarchy[0] = hierarchy[0].filter(node => node.id !== "FAKE__ISLAND")
		if (!hierarchy[0].length) {
			hierarchy.splice(0, 1)
		} else {
			hierarchy[0] = [...hierarchy[0], ...hierarchy.splice(1, 1)[0]]
		}
		//Compute the offset for each level
		let previousOffset = 0
		const levelOffsets = hierarchy.map(level => {
			const biggestSize = Math.max(
				...level.map(node => {
					return this.isVerticalLayout ? this.getHeight(node) : this.getWidth(node)
				})
			)
			const thisOffest = previousOffset + biggestSize / 2
			previousOffset = thisOffest + biggestSize / 2 + this.PADDING_PX
			return thisOffest
		})
		//Compute tree
		/** @type {Map<string, Set<string>>} */
		const edgeFromMap = new Map(this.nodes.map(node => [node.id, new Set()]))
		acyclicEdges.forEach(edge => {
			edgeFromMap.get(edge.targetNode).add(edge.sourceNode)
		})
		const tree = []
		let allTreeNodes = []
		let previousTreeNodes = []
		let level = -1
		do {
			level++
			let previousNode = null
			let previousParent = null
			const treeNodes = hierarchy.splice(0, 1)[0].map(node => {
				const parent = previousTreeNodes.find(parent => edgeFromMap.get(node.id).has(parent.node.id))
				const size = this.isVerticalLayout ? this.getWidth(node) : this.getHeight(node)
				const treeNode = {
					node,
					children: [],
					size,
					parent,
					previousSibling: previousParent === parent ? previousNode : null,
					levelOffset: levelOffsets[level],
					orderOffset: null,
					modifier: null
				}
				if (parent) {
					previousParent = parent
					parent.children.push(treeNode)
				} else {
					tree.push(treeNode)
				}
				previousNode = treeNode
				return treeNode
			})
			allTreeNodes = allTreeNodes.concat(...treeNodes)
			previousTreeNodes = treeNodes
		} while (hierarchy.length)
		//First pass
		const firstPass = treeNode => {
			if (treeNode.children) {
				treeNode.children.forEach(child => firstPass(child))
			}
			if (treeNode.previousSibling) {
				treeNode.orderOffset = treeNode.previousSibling.orderOffset + treeNode.previousSibling.size / 2 + this.PADDING_PX + treeNode.size / 2
			} else {
				treeNode.orderOffset = 0
			}

			if (treeNode.children.length == 1) {
				treeNode.modifier = treeNode.orderOffset
			} else if (treeNode.children.length >= 2) {
				let minOffset = Infinity
				let maxOffset = -minOffset
				for (let i = 0; i < treeNode.children.length; i++) {
					minOffset = Math.min(minOffset, treeNode.children[i].orderOffset)
					maxOffset = Math.max(maxOffset, treeNode.children[i].orderOffset)
				}
				treeNode.modifier = treeNode.orderOffset - (maxOffset - minOffset) / 2
			}
		}
		tree.forEach(treeNode => firstPass(treeNode))
		//Second pass
		const secondPass = (treeNode, modifier) => {
			treeNode.orderOffset = treeNode.orderOffset + modifier
			for (let i = 0; i < treeNode.children.length; i++) {
				secondPass(treeNode.children[i], treeNode.modifier + modifier)
			}
		}
		tree.forEach(treeNode => secondPass(treeNode, 0))
		//Fix node conflicts
		const getContour = node => {
			//This returns an array of levels (below) the input node, with a lowest (left) orderOffset and a highest (right) orderOffset
			const levels = []
			let nextLevel = [node]
			do {
				levels.push(nextLevel)
				nextLevel = []
				levels[levels.length - 1].forEach(node => (nextLevel = nextLevel.concat(node.children)))
			} while (nextLevel.length)
			levels.shift()
			return levels.map(level => {
				const result = { left: Infinity, right: -Infinity }
				level.forEach(node => {
					result.left = Math.min(
						result.left,
						node.orderOffset - (this.isVerticalLayout ? this.getWidth(node.node) / 2 : this.getHeight(node.node) / 2)
					)
					result.right = Math.max(
						result.right,
						node.orderOffset + (this.isVerticalLayout ? this.getWidth(node.node) / 2 : this.getHeight(node.node) / 2)
					)
				})
				return result
			})
		}
		const applyBranchAdjustment = (node, adjustment) => {
			//This moves nodes and all sub-branches x pixels to the right
			let children = [node]
			while (children.length) {
				const next = children.shift()
				children = children.concat(next.children)
				next.orderOffset += adjustment
			}
		}
		const fixNodeConflicts = treeNode => {
			//This algorithm executes from bottom to top
			for (let i = 0; i < treeNode.children.length; i++) {
				fixNodeConflicts(treeNode.children[i])
			}
			//If there is less than two children then we don't need to do anything
			if (treeNode.children.length < 2) return
			//For each child, compare it to everything to the right of it.
			for (let i = 0; i < treeNode.children.length - 1; i++) {
				const leftNode = treeNode.children[i]
				const leftContour = getContour(leftNode)
				for (let j = i + 1; j < treeNode.children.length; j++) {
					const rightNode = treeNode.children[j]
					const rightContour = getContour(rightNode)
					//There may be a different amount of levels. We will compare all possible levels
					for (let n = 0; n < Math.min(leftContour.length, rightContour.length); n++) {
						const left = Math.max(leftContour[n].right)
						const right = Math.min(rightContour[n].left)
						//If the right side branch overlaps the left side branch we need to make an adjustment
						if (left > right) {
							const adjustment = left - right + this.PADDING_PX
							//Adjust the entire right branch
							applyBranchAdjustment(rightNode, adjustment)
							//All nodes (and branches) between (i) and (j) need to also be adjusted now to fill the newly created space
							const middleSiblings = []
							for (let m = i + 1; m < j; m++) {
								middleSiblings.push(treeNode.children[m])
							}
							if (middleSiblings.length) {
								const middleAdjustment = adjustment / middleSiblings.length / 2
								for (let m = 0; m < middleSiblings.length; m++) {
									applyBranchAdjustment(middleSiblings[m], middleAdjustment)
								}
							}
						}
					}
				}
			}
			//Finally, we center the root nodes around their children
			if (!treeNode.parent && treeNode.children.length) {
				let offset = 0
				treeNode.children.forEach(child => {
					offset += child.orderOffset
				})
				treeNode.orderOffset = offset / treeNode.children.length
			}
		}
		//There can be multiple root nodes, so we create a "fake" root node to handle this.
		fixNodeConflicts({ children: tree, levelOffset: 0 })
		//Write positions to member state
		allTreeNodes.forEach(treeNode => {
			this.nodePositions.set(treeNode.node, {
				y: this.isVerticalLayout ? treeNode.levelOffset : treeNode.orderOffset,
				x: this.isVerticalLayout ? treeNode.orderOffset : treeNode.levelOffset
			})
		})
		//Center the layout
		const averageCoordinates = this.getAverageCoordinates()
		this.centerX === null && (this.centerX = averageCoordinates[0])
		this.centerY === null && (this.centerY = averageCoordinates[1])
		let totalX = 0
		let totalY = 0
		this.nodePositions.forEach(value => {
			totalX += value.x
			totalY += value.y
		})
		const currentCenterX = totalX / this.nodePositions.size
		const currentCenterY = totalY / this.nodePositions.size
		const deltaX = this.centerX - currentCenterX
		const deltaY = this.centerY - currentCenterY
		this.nodePositions.forEach(value => {
			value.x = deltaX + value.x
			value.y = deltaY + value.y
		})
	}

	execute() {
		let node
		let position
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			position = this.nodePositions.get(node)
			node.fx = position.x
			node.x = position.x
			node.fy = position.y
			node.y = position.y
		}
	}

	dismount() {
		this.nodes.forEach(node => {
			delete node.fx
			delete node.fy
		})
	}
}
