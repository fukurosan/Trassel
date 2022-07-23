import { computeRadian } from "../util/mathutils"
import LayoutComponent from "./layoutcomponent"

/**
 * Creates a fan component that pushes groups of nodes into a fan formation
 * @param {(any => "string")} computeGroup - A function that will take the node as an argument and return a group ID.
 * @param {number=} strength - How strong should the pull be? (0-1)
 * @param {number=} space - How many pixels from the center should the first node be drawn?
 * @param {number=} centerX - Center X coordinate of the component
 * @param {number=} centerY - Center Y coordinate of the component
 */
export default class Fan extends LayoutComponent {
	constructor(computeGroup = node => node.type, strength = 0.9, space = 300, centerX = null, centerY = null) {
		super()
		this.computeGroup = computeGroup
		this.strength = strength
		this.positionMap = new Map()
		this.centerX = centerX
		this.centerY = centerY
		this.space = space
	}

	initialize(...args) {
		super.initialize(...args)
		//Center will only be determined on the first initialization
		const averageCoordinates = this.getAverageCoordinates()
		this.centerX === null && (this.centerX = averageCoordinates[0])
		this.centerY === null && (this.centerY = averageCoordinates[1])
		//Determine node positions relative to center
		this.positionMap.clear()
		const groupsMap = new Map()
		this.nodes.forEach(node => {
			const group = this.computeGroup(node)
			if (!groupsMap.has(group)) {
				groupsMap.set(group, [node])
			} else {
				groupsMap.get(group).push(node)
			}
		})
		const degreeIncrements = Math.floor(360 / groupsMap.size)
		Array.from(groupsMap.keys()).forEach((key, index) => {
			const radian = computeRadian(degreeIncrements * index)
			const radianCos = Math.cos(radian)
			const radianSin = Math.sin(radian)
			const initialX = this.centerX + this.space * radianCos
			const initialY = this.centerY + this.space * radianSin
			let lastPosition = [initialX, initialY]
			groupsMap.get(key).forEach(node => {
				const diameter = node.radius * 2
				const x = diameter * radianCos + lastPosition[0]
				const y = diameter * radianSin + lastPosition[1]
				this.positionMap.set(node.id, [x, y])
				const nextX = diameter * radianCos + x
				const nextY = diameter * radianSin + y
				lastPosition = [nextX, nextY]
			})
		})
	}

	execute() {
		//		const force = alpha * this.strength
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			const target = this.positionMap.get(node.id)
			//node.vx -= (node.x - target[0]) * force
			//node.vy -= (node.y - target[1]) * force
			node.fx = target[0]
			node.fy = target[1]
		}
	}

	dismount() {
		this.nodes.forEach(node => {
			delete node.fx
			delete node.fy
		})
	}
}
