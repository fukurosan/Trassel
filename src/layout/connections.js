import { determineLevels } from "./algorithms/determinelevels"
import { makeAcyclic } from "./algorithms/makeacyclic"
import LayoutComponent from "./layoutcomponent"

/**
 * Creates a rectangular connection graph layout.
 * @param {(import("../model/ibasicnode").IBasicNode) => number} groupBy - Optional function to group nodes
 * @param {boolean=} isVerticalLayout - If true the tree will be top to bottom, otherwise it will be left to right
 * @param {number=} padding - Minimum padding between nodes described in pixels
 * @param {number=} centerX - Center X coordinate of the component
 * @param {number=} centerY - Center Y coordinate of the component
 */
export default class Connections extends LayoutComponent {
	constructor(groupBy = null, isVerticalLayout = true, padding = 100, centerX = null, centerY = null) {
		super()
		this.groupBy = groupBy
		this.isVerticalLayout = isVerticalLayout
		this.PADDING_PX = padding
		this.centerX = centerX
		this.centerY = centerY
		this.nodePositions = new Map()
	}

	getWidth(node) {
		return node.width ? node.width : node.radius * 2
	}

	getHeight(node) {
		return node.height ? node.height : node.radius * 2
	}

	initialize(...args) {
		super.initialize(...args)
		//Compute acyclic hierarchy
		let hierarchy = []
		const acyclicEdges = makeAcyclic(this.nodes, this.edges)
		if (this.groupBy) {
			const groups = {}
			this.nodes.forEach(node => {
				const group = this.groupBy(node)
				if (!groups[group]) groups[group] = []
				groups[group].push(node)
			})
			Object.keys(groups)
				.sort()
				.forEach(key => {
					hierarchy.push(groups[key])
				})
		} else {
			hierarchy = determineLevels([...this.nodes, { id: "FAKE__ISLAND" }], acyclicEdges).hierarchy
			//This is just because of how the determineLevels function works.
			//If there are island nodes then these will all be placed in the top level, with the tree starting in the second level.
			//This won't work with this algorithm since it assumes the structure is a tree
			hierarchy[0] = hierarchy[0].filter(node => node.id !== "FAKE__ISLAND")
			if (!hierarchy[0].length) {
				hierarchy.splice(0, 1)
			} else {
				hierarchy[0] = [...hierarchy[0], ...hierarchy.splice(1, 1)[0]]
			}
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
		//Compute broadest level size
		const broadestSize = hierarchy.reduce((acc, level) => {
			const candidate =
				level.reduce((acc, node) => {
					acc += this.isVerticalLayout ? this.getWidth(node) : this.getHeight(node)
					return acc
				}, 0) +
				this.PADDING_PX * (level.length - 1)
			return candidate > acc ? candidate : acc
		}, 1)
		//Sort levels
		/** @type {Map<string, Set<string>>} */
		const edgeFromMap = new Map(this.nodes.map(node => [node.id, new Set()]))
		acyclicEdges.forEach(edge => {
			edgeFromMap.get(edge.targetNode).add(edge.sourceNode)
		})
		let previousLevel = null
		hierarchy.map(level => {
			if (previousLevel === null) {
				previousLevel = level
				return
			}
			const parentIndexCache = new Map()
			const getParentIndex = id => {
				if (parentIndexCache.has(id)) {
					return parentIndexCache.get(id)
				}
				const index = previousLevel.findIndex(parent => edgeFromMap.get(id).has(parent.id))
				parentIndexCache.set(id, typeof index === "number" ? index : -1)
				return index
			}
			level.sort((a, b) => {
				const aIndex = getParentIndex(a.id)
				const bIndex = getParentIndex(b.id)
				if (aIndex > bIndex) return 1
				if (aIndex < bIndex) return -1
				else return 0
			})
			previousLevel = level
		})
		//Compute positions
		this.nodePositions = new Map()
		const nodeSizes = new Map(this.nodes.map(node => [node.id, this.isVerticalLayout ? this.getWidth(node) : this.getHeight(node)]))
		hierarchy.forEach((level, levelIndex) => {
			const fullSize = level.reduce((acc, node) => {
				acc += nodeSizes.get(node.id)
				return acc
			}, 0)
			const space = broadestSize - fullSize
			const spacePerNode = space / (level.length - 1)
			let lastOffset = 0
			if (level.length === 1) {
				const node = level[0]
				const position = broadestSize / 2
				this.nodePositions.set(node, {
					y: this.isVerticalLayout ? position : levelOffsets[levelIndex],
					x: this.isVerticalLayout ? levelOffsets[levelIndex] : position
				})
			} else {
				level.forEach(node => {
					const nodeSize = nodeSizes.get(node.id)
					const position = lastOffset + nodeSize / 2
					lastOffset = position + spacePerNode + nodeSize / 2
					this.nodePositions.set(node, {
						y: this.isVerticalLayout ? position : levelOffsets[levelIndex],
						x: this.isVerticalLayout ? levelOffsets[levelIndex] : position
					})
				})
			}
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
