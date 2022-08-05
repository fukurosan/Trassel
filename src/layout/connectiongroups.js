import { determineLevels } from "./algorithms/determinelevels"
import { makeAcyclic } from "./algorithms/makeacyclic"
import LayoutComponent from "./layoutcomponent"

/**
 * Creates an tree component that sorts nodes on an axis (either y or x) based on the Reingold-Tilford algorithm
 * @param {boolean=} isVerticalLayout - If true the hierachy will be top to bottom, otherwise it will be left to right
 * @param {number=} centerX - Center X coordinate of the component
 * @param {number=} centerY - Center Y coordinate of the component
 */
export default class Tree extends LayoutComponent {
	constructor(isVerticalLayout = true, padding = 100) {
		super()
		this.isVerticalLayout = isVerticalLayout
		this.PADDING_PX = padding
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
		const acyclicEdges = makeAcyclic(this.nodes, this.edges)
		const { hierarchy } = determineLevels([...this.nodes, { id: "FAKE__ISLAND" }], acyclicEdges)
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
			const treeNodes = hierarchy.splice(0, 1)[0].map(node => {
				const parent = previousTreeNodes.find(parent => edgeFromMap.get(node.id).has(parent.node.id))
				const size = this.isVerticalLayout ? this.getWidth(node) : this.getHeight(node)
				const treeNode = {
					node,
					children: [],
					size,
					previousSibling: previousNode,
					levelOffset: levelOffsets[level],
					orderOffset: null,
					modifier: null
				}
				if (parent) {
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
				let minY = Infinity
				let maxY = -minY
				for (let i = 0; i < treeNode.children.length; i++) {
					minY = Math.min(minY, treeNode.children[i].orderOffset)
					maxY = Math.max(maxY, treeNode.children[i].orderOffset)
				}
				treeNode.modifier = treeNode.orderOffset - (maxY - minY) / 2
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
		/*const getContour = (root, value, fn) => {
			let nodes = [root]
			while (nodes.length) {
				const node = nodes.shift()
				nodes = nodes.concat(node.children)
				value = fn(value, node.orderOffset)
			}
			return value
		}
		const fixNodeConflicts = treeNode => {
			for (let i = 0; i < treeNode.children.length; i++) {
				fixNodeConflicts(treeNode.children[i])
			}
			for (let i = 0; i < treeNode.children.length - 1; i++) {
				const bottomContour = getContour(treeNode.children[i], -Infinity, Math.max)
				const topContour = getContour(treeNode.children[i + 1], Infinity, Math.min)
				if (bottomContour >= topContour) {
					let nodes = [treeNode.children[i + 1]]
					while (nodes.length) {
						const node = nodes.shift()
						nodes = nodes.concat(node.children)
						node.orderOffset += bottomContour - topContour
					}
				}
			}
		}
		tree.forEach(treeNode => fixNodeConflicts(treeNode))*/
		//Write positions to member state
		allTreeNodes.forEach(treeNode => {
			this.nodePositions.set(treeNode.node, {
				y: this.isVerticalLayout ? treeNode.levelOffset : treeNode.orderOffset,
				x: this.isVerticalLayout ? treeNode.orderOffset : treeNode.levelOffset
			})
		})
		//Center the layout
		//TODO
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
