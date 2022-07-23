import { determineLevels } from "./algorithms/determinelevels"
import disjointGroups from "./algorithms/disjointgroups"
import { crossingMinimizationOrder } from "./algorithms/crossingminimizationorder"
import { makeAcyclic } from "./algorithms/makeacyclic"
import { straightenEdges } from "./algorithms/straightenedges"
import LayoutComponent from "./layoutcomponent"

/**
 * Creates an hierarhical component that sorts nodes on an axis (either y or x) based on the Sugiyama Framework
 * To learn more about the sugiyama framework and hierarchical graph layouts check out this great video series by Philipp Kindermann:
 * https://www.youtube.com/watch?v=3_FbSCWLC3A
 * @param {(any => "string")=} computeGroup - A function that will take the node as an argument and return a group ID. If left blank the groups will be computed.
 * @param {boolean=} useY - If true the hierachy will be top to bottom, otherwise it will be left to right
 * @param {number=} distance - How much space should be between nodes. If not set this will be determined by the size of the nodes
 * @param {boolean=} useLine - If set nodes will be set into a fixed order, trying to minimize edge crossings.
 * @param {number=} centerX - Center X coordinate of the component
 * @param {number=} centerY - Center Y coordinate of the component
 */
export default class Hierarchy extends LayoutComponent {
	constructor(computeGroup = null, useY = true, distance = undefined, useLine = true, centerX = null, centerY = null) {
		super()
		this.computeGroup = computeGroup
		this.useY = useY
		this.distance = distance
		this.useLine = useLine
		this.centerX = centerX
		this.centerY = centerY

		this.groups = []
		this.offsetDistance = 0
		this.halfSize = 0
		this.halfWidth = 0
		this.orderMeasurement = 0
		this.offsetSizeMultiplier = 4
	}

	getWidth(node) {
		return node.width ? node.width : node.radius * 2
	}

	getHeight(node) {
		return node.height ? node.height : node.radius * 2
	}

	initialize(...args) {
		super.initialize(...args)
		//Compute sizes
		const computeLevelMeasurement = this.useY ? this.getHeight : this.getWidth
		const computeOrderMeasurement = this.useY ? this.getWidth : this.getHeight
		this.orderMeasurement = 0
		let levelMeasurement = this.distance ? this.distance : 0

		this.nodes.forEach(node => {
			if (!this.distance) {
				levelMeasurement = Math.max(levelMeasurement, computeLevelMeasurement(node))
			}
			this.orderMeasurement = Math.max(this.orderMeasurement, computeOrderMeasurement(node))
		})
		this.offsetDistance = levelMeasurement * this.offsetSizeMultiplier
		this.offsetDistance < 250 && (this.offsetDistance = 250)
		this.orderMeasurement *= 1.5

		//Compute level groups
		if (this.computeGroup) {
			const newGroups = {}
			this.nodes.forEach(node => {
				let group = this.computeGroup(node)
				if (group === null || group === undefined) {
					group = 0
				}
				if (!newGroups[group]) {
					newGroups[group] = [node]
				} else {
					newGroups[group].push(node)
				}
			})
			this.groups = Object.keys(newGroups)
				.sort((a, b) => {
					const valueAInt = parseInt(a)
					const valueBInt = parseInt(b)
					const valueA = isNaN(valueAInt) ? a : valueAInt
					const valueB = isNaN(valueBInt) ? a : valueBInt
					if (valueA < valueB) {
						return -1
					}
					if (valueA > valueB) {
						return 1
					}
					return 0
				})
				.map(key => newGroups[key])
			if (this.useLine) {
				const acyclicEdges = makeAcyclic(this.nodes, this.edges)
				this.groups = crossingMinimizationOrder(this.groups, acyclicEdges)
				this.groups = straightenEdges(this.groups, acyclicEdges)
			}
		} else {
			//Auto compute a hierarchy layout
			//Compute the sub graphs inside of the graph
			const subGraphs = disjointGroups(this.nodes, this.edges)

			//For each sub graph compute a hierarchy
			let hierarchies = subGraphs.map(nodeArray => {
				const acyclicEdges = makeAcyclic(nodeArray, this.edges)
				const { hierarchy, fakeNodesHierarchy, fakeEdges } = determineLevels(nodeArray, acyclicEdges)
				if (this.useLine) {
					const joinedHierarchy = hierarchy.map((level, index) => [...level, ...fakeNodesHierarchy[index]])
					const joinedEdges = [...acyclicEdges, ...fakeEdges]
					let orderedNodes = crossingMinimizationOrder(joinedHierarchy, joinedEdges)
					orderedNodes = straightenEdges(orderedNodes, [...acyclicEdges, ...fakeEdges])
					return orderedNodes
				}
				return hierarchy
			})

			if (this.useLine) {
				//Make sure all hierarchies are the same length
				const longestHierarchy = hierarchies.reduce((acc, hierarchy) => Math.max(acc, hierarchy.length), 0)
				hierarchies.forEach(hierarchy => {
					const maxRows = Math.max(...hierarchy.map(level => level.length))
					if (hierarchy.length < longestHierarchy) {
						for (let i = hierarchy.length; i < longestHierarchy; i++) {
							hierarchy.push(new Array(maxRows).fill(null))
						}
					}
				})
			}

			//Merge the hierarchies
			hierarchies = hierarchies.reduce((acc, hierarchy) => {
				hierarchy.forEach((level, index) => {
					if (!acc[index]) {
						acc[index] = level
					} else {
						acc[index] = [...acc[index], ...level]
					}
				})
				return acc
			}, [])

			this.groups = hierarchies
			this.halfSize = ((this.groups.length - 1) * this.offsetDistance) / 2
			this.halfWidth = (Math.max(...hierarchies.map(level => level.length)) * this.orderMeasurement) / 2
			//Center will only be determined on the first initialization
			const averageCoordinates = this.getAverageCoordinates()
			this.centerX === null && (this.centerX = averageCoordinates[0])
			this.centerY === null && (this.centerY = averageCoordinates[1])
		}
	}

	execute() {
		const parameter = this.useY ? "y" : "x"
		const lineParameter = this.useY ? "x" : "y"
		const parameterCenter = this.useY ? this.centerY : this.centerX
		const lineParameterCenter = this.useY ? this.centerX : this.centerY
		let group
		let node
		for (let i = 0; i < this.groups.length; i++) {
			group = this.groups[i]
			const coordinate = i * this.offsetDistance - this.halfSize
			for (let j = 0; j < group.length; j++) {
				node = group[j]
				if (!node) {
					//There can be blank nodes inserted to create space
					continue
				}
				node["f" + parameter] = coordinate + parameterCenter
				if (this.useLine) {
					node["f" + lineParameter] = j * this.orderMeasurement - this.halfWidth + lineParameterCenter
				}
			}
		}
	}

	dismount() {
		this.nodes.forEach(node => {
			delete node.fx
			delete node.fy
		})
	}
}
