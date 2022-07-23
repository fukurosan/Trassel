/**
 * This is a point region quadtree (i.e. all nodes must have their own quadrant, the only exception being identically positioned nodes).
 * This can be used for collision detection as well as n-body approximations such as Barnes and Hut
 * To read more about quad trees:
 * https://en.wikipedia.org/wiki/
 */
export default class Quadtree {
	/**
	 * @param {import("../model/igraphnode").IGraphNode[]=} entities - Graph nodes to base the quadtree on
	 */
	constructor(entities = []) {
		this.isMassComputed = false
		this.isLargestRadiusComputed = false
		this.entities = []
		this.quadrants = new Array(4)
		this.bounds = { xStart: 0, yStart: 0, xEnd: 1, yEnd: 1 }
		this.initialize(entities)
	}

	/**
	 * (Re)Computes the quadtree with new graph nodes
	 * @param {import("../model/igraphnode").IGraphNode[]} entities
	 */
	initialize(entities = []) {
		this.isMassComputed = false
		this.isLargestRadiusComputed = false
		this.entities = entities
		this.bounds = this.getBounds()
		this.quadrants = new Array(4)
		for (let i = 0; i < entities.length; i++) {
			this.addEntity(entities[i])
		}
	}

	/**
	 * Recomputes the quadtree with the currently assigned nodes
	 */
	update() {
		this.initialize(this.entities)
	}

	/**
	 * Computes the bounds of the quad tree based on the contained entities
	 * @returns {import("../model/ibounds").IBounds}
	 */
	getBounds() {
		let xStart = 0
		let yStart = 0
		let xEnd = 1
		let yEnd = 1
		for (let i = 0; i < this.entities.length; i++) {
			const entity = this.entities[i]
			entity.x - 1 < xStart && (xStart = Math.floor(entity.x - 1))
			entity.x + 1 > xEnd && (xEnd = Math.ceil(entity.x + 1))
			entity.y - 1 < yStart && (yStart = Math.floor(entity.y - 1))
			entity.y + 1 > yEnd && (yEnd = Math.ceil(entity.y + 1))
		}
		//Ensure that the quad tree is square
		const width = xEnd - xStart
		const height = yEnd - yStart
		if (width > height) {
			const delta = width - height
			yStart -= delta / 2
			yEnd += delta / 2
		} else if (height > width) {
			const delta = height - width
			xStart -= delta / 2
			xEnd += delta / 2
		}
		return {
			xStart,
			yStart,
			xEnd,
			yEnd
		}
	}

	/**
	 * The quadtree is recomputed by calling this function sequentially for each graph entity
	 * @param {import("../model/igraphnode").IGraphNode} entity
	 * @returns
	 */
	addEntity(entity) {
		let parent
		let quadNode = this.quadrants
		const leaf = { entity, next: null }
		let xStart = this.bounds.xStart
		let yStart = this.bounds.yStart
		let xEnd = this.bounds.xEnd
		let yEnd = this.bounds.yEnd
		let horizontalCenter
		let verticalCenter
		let right
		let bottom
		let i
		let j

		// Find a suitable leaf position or create one.
		// If length is undefined then we have found an entity node
		while (quadNode.length) {
			//Determine what quadrant of the current parent quadrant we belong in
			horizontalCenter = (xStart + xEnd) / 2
			verticalCenter = (yStart + yEnd) / 2
			right = entity.x >= horizontalCenter
			bottom = entity.y >= verticalCenter
			right ? (xStart = horizontalCenter) : (xEnd = horizontalCenter)
			bottom ? (yStart = verticalCenter) : (yEnd = verticalCenter)

			//The parent is now the old quadrant we just traversed
			parent = quadNode

			//The quad node to traverse next is the one we fit into
			i = (bottom << 1) | right
			quadNode = quadNode[i]

			//If the new quad node is undefined (a set of quadrants have been created, but this specific section is empty)
			//Then add the entity here and stop
			if (!quadNode) {
				parent[i] = leaf
				return
			}
		}

		// If the leaf on the quadrant is exactly the same as this one then create a linked list and return
		const xPrevious = quadNode.entity.x
		const yPrevious = quadNode.entity.y
		if (entity.x === xPrevious && entity.y === yPrevious) {
			leaf.next = quadNode
			parent[i] = leaf
			return
		}

		// Otherwise we split the quadrant until the two quad nodes are separated
		let rightPrevious
		let bottomPrevious
		let continueLoop = true
		while (continueLoop) {
			parent[i] = new Array(4)
			parent = parent[i]
			//Where is the center?
			horizontalCenter = (xStart + xEnd) / 2
			verticalCenter = (yStart + yEnd) / 2

			//In what quadrant does this entity fit?
			right = entity.x >= horizontalCenter
			bottom = entity.y >= verticalCenter

			//In what quadrant does the existing leaf fit?
			rightPrevious = xPrevious >= horizontalCenter
			bottomPrevious = yPrevious >= verticalCenter

			//This will result in an index between 0-3 corresponding to a newly assigned quadrant
			i = (bottom << 1) | right
			j = (bottomPrevious << 1) | rightPrevious

			//If the entity and the existing leaf are still in the same quadrant we need to keep splitting
			continueLoop = i === j

			//Preapare for the next iteration by adjusting quadrant measurements
			if (continueLoop) {
				right ? (xStart = horizontalCenter) : (xEnd = horizontalCenter)
				bottom ? (yStart = verticalCenter) : (yEnd = verticalCenter)
			}
		}

		//Assign the nodes to the quadrants we computed in the while loop
		parent[j] = quadNode
		parent[i] = leaf
	}

	/**
	 * Traverses the tree from top to bottom. Will execute a callback for each quadrant and leaf.
	 * If the callback returns a truthy value then the quadrant in question will not be drilled further down into
	 * @param {(quadNode?: import("../model/quadmember").QuadMember, xStart: number, yStart: number, xEnd: number, yEnd: number) => boolean} callback
	 * @returns
	 */
	traverseTopBottom(callback) {
		const quadrants = []
		let quadNode
		let child
		let xStart
		let yStart
		let xEnd
		let yEnd
		let horizontalCenter
		let verticalCenter
		let quadrant = { quadNode: this.quadrants, xStart: this.bounds.xStart, xEnd: this.bounds.xEnd, yStart: this.bounds.yStart, yEnd: this.bounds.yEnd }
		while (quadrant) {
			quadNode = quadrant.quadNode
			xStart = quadrant.xStart
			yStart = quadrant.yStart
			xEnd = quadrant.xEnd
			yEnd = quadrant.yEnd
			if (!callback(quadNode, xStart, yStart, xEnd, yEnd) && quadNode.length) {
				horizontalCenter = (xStart + xEnd) / 2
				verticalCenter = (yStart + yEnd) / 2
				if ((child = quadNode[0])) quadrants.push({ quadNode: child, xStart, yStart, xEnd: horizontalCenter, yEnd: verticalCenter })
				if ((child = quadNode[1])) quadrants.push({ quadNode: child, xStart: horizontalCenter, yStart, xEnd, yEnd: verticalCenter })
				if ((child = quadNode[2])) quadrants.push({ quadNode: child, xStart, yStart: verticalCenter, xEnd: horizontalCenter, yEnd })
				if ((child = quadNode[3])) quadrants.push({ quadNode: child, xStart: horizontalCenter, yStart: verticalCenter, xEnd, yEnd })
			}
			quadrant = quadrants.pop()
		}
	}

	/**
	 * Executes a callback for each quadrant in the graph from bottom to top.
	 * @param {(quadNode?: import("../model/quadmember").QuadMember, xStart: number, yStart: number, xEnd: number, yEnd: number) => boolean} callback
	 * @returns
	 */
	traverseBottomTop(callback) {
		const quadrants = []
		const result = []
		let child
		let xStart
		let yStart
		let xEnd
		let yEnd
		let horizontalCenter
		let verticalCenter
		let quadNode
		let quadrant = { quadNode: this.quadrants, xStart: this.bounds.xStart, xEnd: this.bounds.xEnd, yStart: this.bounds.yStart, yEnd: this.bounds.yEnd }
		while (quadrant) {
			quadNode = quadrant.quadNode
			if (quadNode.length) {
				xStart = quadrant.xStart
				yStart = quadrant.yStart
				xEnd = quadrant.xEnd
				yEnd = quadrant.yEnd
				horizontalCenter = (xStart + xEnd) / 2
				verticalCenter = (yStart + yEnd) / 2
				if ((child = quadNode[0])) quadrants.push({ quadNode: child, xStart, yStart, xEnd: horizontalCenter, yEnd: verticalCenter })
				if ((child = quadNode[1])) quadrants.push({ quadNode: child, xStart: horizontalCenter, yStart, xEnd, yEnd: verticalCenter })
				if ((child = quadNode[2])) quadrants.push({ quadNode: child, xStart, yStart: verticalCenter, xEnd: horizontalCenter, yEnd })
				if ((child = quadNode[3])) quadrants.push({ quadNode: child, xStart: horizontalCenter, yStart: verticalCenter, xEnd, yEnd })
			}
			result.push(quadrant)
			quadrant = quadrants.pop()
		}
		while ((quadrant = result.pop())) {
			callback(quadrant.quadNode, quadrant.xStart, quadrant.yStart, quadrant.xEnd, quadrant.yEnd)
		}
	}

	/**
	 * Computes the mass of each quadNode and aggregates entity coordinates into an average center.
	 * Used for example when computing Barnes and Huts n-body approximation
	 */
	computeMass() {
		if (this.isMassComputed) return
		this.traverseBottomTop(quadNode => {
			//quadNode is a quadrant
			if (quadNode.length) {
				let totalX = 0
				let totalY = 0
				let totalMass = 0
				for (let i = 0; i < 4; i++) {
					const child = quadNode[i]
					if (child) {
						totalMass += child.mass
						totalX += child.mass * child.x
						totalY += child.mass * child.y
					}
				}
				quadNode.x = totalX / totalMass
				quadNode.y = totalY / totalMass
				quadNode.mass = totalMass
			}
			//quadNode is a leaf node
			else {
				let totalMass = 0
				let nextQuadNode = quadNode
				do {
					totalMass += nextQuadNode.entity.mass
				} while ((nextQuadNode = nextQuadNode.next))
				quadNode.x = quadNode.entity.x
				quadNode.y = quadNode.entity.y
				quadNode.mass = totalMass
			}
		})
		this.isMassComputed = true
	}

	/**
	 * Records the largest radius on each quad node.
	 * This is useful for example in collision detection.
	 * We need this information because a point can stretch across multiple quadrants.
	 * This is a downside of an adaptive tree.
	 * @param {number} padding - Adds a padding to all radiuses
	 */
	computeLargestRadius(padding = 0) {
		if (this.isLargestRadiusComputed) return
		this.traverseBottomTop(quadNode => {
			//If it is an entity
			if (quadNode.entity) {
				quadNode.radius = quadNode.entity.radius + padding
				return
			}
			//If it is a quadrant
			quadNode.radius = 0
			for (let i = 0; i < 4; i++) {
				if (quadNode[i] && quadNode[i].radius > quadNode.radius) {
					quadNode.radius = quadNode[i].radius
				}
			}
		})
		this.isLargestRadiusComputed = true
	}
}
