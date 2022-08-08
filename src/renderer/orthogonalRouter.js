/**
 * This is taken straight from:
 * https://gist.github.com/jose-mdz/4a8894c152383b9d7a870c24a04447e4
 * https://medium.com/swlh/routing-orthogonal-diagram-connectors-in-javascript-191dc2c5ff70
 * Code has been converted to regular JavaScript.
 * A few changes have been made. Most especially if no side for the provided points has been provided the closest sides will be computed.
 *
 * Usage like so:
 * // Define shapes
 * const shapeA = {left: 50,  top: 50, width: 100, height: 100}
 * const shapeB = {left: 200, top: 200, width: 50, height: 100}
 *
 * // Get the connector path
 * const path = OrthogonalConnector.route({
 *     pointA: {shape: shapeA, side: 'bottom', distance: 0.5},
 *     pointB: {shape: shapeB, side: 'right',  distance: 0.5},
 *     shapeMargin: 10,
 *     globalBoundsMargin: 100,
 *     globalBounds: {left: 0, top: 0, width: 500, height: 500},
 * })
 *
 * // Draw path
 * const {x, y} = path.shift()
 * moveTo(x, y)
 * path.forEach(path => lineTo(path.x, path.y))
 */

/**
 * Utility Point creator
 * @param x
 * @param y
 */
function makePt(x, y) {
	return { x, y }
}

/**
 * Computes distance between two points
 * @param a
 * @param b
 */
function distance(a, b) {
	return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

/**
 * Abstracts a Rectangle and adds geometric utilities
 */
class Rectangle {
	constructor(left, top, width, height) {
		this.left = left
		this.top = top
		this.width = width
		this.height = height
	}

	static get empty() {
		return new Rectangle(0, 0, 0, 0)
	}

	static fromRect(r) {
		return new Rectangle(r.left, r.top, r.width, r.height)
	}

	static fromLTRB(left, top, right, bottom) {
		return new Rectangle(left, top, right - left, bottom - top)
	}

	contains(p) {
		return p.x >= this.left && p.x <= this.right && p.y >= this.top && p.y <= this.bottom
	}

	inflate(horizontal, vertical) {
		return Rectangle.fromLTRB(this.left - horizontal, this.top - vertical, this.right + horizontal, this.bottom + vertical)
	}

	intersects(rectangle) {
		const thisX = this.left
		const thisY = this.top
		const thisW = this.width
		const thisH = this.height
		const rectX = rectangle.left
		const rectY = rectangle.top
		const rectW = rectangle.width
		const rectH = rectangle.height
		return rectX < thisX + thisW && thisX < rectX + rectW && rectY < thisY + thisH && thisY < rectY + rectH
	}

	union(r) {
		const x = [this.left, this.right, r.left, r.right]
		const y = [this.top, this.bottom, r.top, r.bottom]
		return Rectangle.fromLTRB(Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y))
	}

	get center() {
		return {
			x: this.left + this.width / 2,
			y: this.top + this.height / 2
		}
	}

	get right() {
		return this.left + this.width
	}

	get bottom() {
		return this.top + this.height
	}

	get location() {
		return makePt(this.left, this.top)
	}

	get northEast() {
		return { x: this.right, y: this.top }
	}

	get southEast() {
		return { x: this.right, y: this.bottom }
	}

	get southWest() {
		return { x: this.left, y: this.bottom }
	}

	get northWest() {
		return { x: this.left, y: this.top }
	}

	get east() {
		return makePt(this.right, this.center.y)
	}

	get north() {
		return makePt(this.center.x, this.top)
	}

	get south() {
		return makePt(this.center.x, this.bottom)
	}

	get west() {
		return makePt(this.left, this.center.y)
	}

	get size() {
		return { width: this.width, height: this.height }
	}
}

/**
 * Represents a node in a graph, whose data is a Point
 */
class PointNode {
	constructor(data) {
		this.data = data
		this.distance = Number.MAX_SAFE_INTEGER
		this.shortestPath = []
		this.adjacentNodes = new Map()
	}
}

/***
 * Represents a Graph of Point nodes
 */
class PointGraph {
	constructor() {
		this.index = {}
	}

	add(p) {
		const { x, y } = p
		const xs = x.toString()
		const ys = y.toString()
		if (!(xs in this.index)) {
			this.index[xs] = {}
		}
		if (!(ys in this.index[xs])) {
			this.index[xs][ys] = new PointNode(p)
		}
	}

	getLowestDistanceNode(unsettledNodes) {
		let lowestDistanceNode = null
		let lowestDistance = Number.MAX_SAFE_INTEGER
		for (const node of unsettledNodes) {
			const nodeDistance = node.distance
			if (nodeDistance < lowestDistance) {
				lowestDistance = nodeDistance
				lowestDistanceNode = node
			}
		}
		return lowestDistanceNode
	}

	inferPathDirection(node) {
		if (node.shortestPath.length == 0) {
			return null
		}
		return this.directionOfNodes(node.shortestPath[node.shortestPath.length - 1], node)
	}

	calculateShortestPathFromSource(graph, source) {
		source.distance = 0
		const settledNodes = new Set()
		const unsettledNodes = new Set()
		unsettledNodes.add(source)
		while (unsettledNodes.size != 0) {
			const currentNode = this.getLowestDistanceNode(unsettledNodes)
			unsettledNodes.delete(currentNode)
			for (const [adjacentNode, edgeWeight] of currentNode.adjacentNodes) {
				if (!settledNodes.has(adjacentNode)) {
					this.calculateMinimumDistance(adjacentNode, edgeWeight, currentNode)
					unsettledNodes.add(adjacentNode)
				}
			}
			settledNodes.add(currentNode)
		}
		return graph
	}

	calculateMinimumDistance(evaluationNode, edgeWeigh, sourceNode) {
		const sourceDistance = sourceNode.distance
		const comingDirection = this.inferPathDirection(sourceNode)
		const goingDirection = this.directionOfNodes(sourceNode, evaluationNode)
		const changingDirection = comingDirection && goingDirection && comingDirection != goingDirection
		const extraWeigh = changingDirection ? Math.pow(edgeWeigh + 1, 2) : 0
		if (sourceDistance + edgeWeigh + extraWeigh < evaluationNode.distance) {
			evaluationNode.distance = sourceDistance + edgeWeigh + extraWeigh
			const shortestPath = [...sourceNode.shortestPath]
			shortestPath.push(sourceNode)
			evaluationNode.shortestPath = shortestPath
		}
	}

	directionOf(a, b) {
		if (a.x === b.x) {
			return "h"
		} else if (a.y === b.y) {
			return "v"
		} else {
			return null
		}
	}

	directionOfNodes(a, b) {
		return this.directionOf(a.data, b.data)
	}

	connect(a, b) {
		const nodeA = this.get(a)
		const nodeB = this.get(b)
		if (!nodeA || !nodeB) {
			throw new Error("A point was not found")
		}
		nodeA.adjacentNodes.set(nodeB, distance(a, b))
	}

	has(p) {
		const { x, y } = p
		const xs = x.toString()
		const ys = y.toString()
		return xs in this.index && ys in this.index[xs]
	}

	get(p) {
		const { x, y } = p
		const xs = x.toString()
		const ys = y.toString()
		if (xs in this.index && ys in this.index[xs]) {
			return this.index[xs][ys]
		}
		return null
	}
}

/**
 * Gets the actual point of the connector based on the distance parameter
 * @param p
 */
function computePt(p) {
	const b = Rectangle.fromRect(p.shape)
	switch (p.side) {
		case "bottom":
			return makePt(b.left + b.width * p.distance, b.bottom)
		case "top":
			return makePt(b.left + b.width * p.distance, b.top)
		case "left":
			return makePt(b.left, b.top + b.height * p.distance)
		case "right":
			return makePt(b.right, b.top + b.height * p.distance)
	}
}

/**
 * Extrudes the connector point by margin depending on it's side
 * @param cp
 * @param margin
 */
function extrudeCp(cp, margin) {
	const { x, y } = computePt(cp)
	switch (cp.side) {
		case "top":
			return makePt(x, y - margin)
		case "right":
			return makePt(x + margin, y)
		case "bottom":
			return makePt(x, y + margin)
		case "left":
			return makePt(x - margin, y)
	}
}

/**
 * Returns flag indicating if the side belongs on a vertical axis
 * @param side
 */
function isVerticalSide(side) {
	return side == "top" || side == "bottom"
}

/**
 * Creates a grid of rectangles from the specified set of rulers, contained on the specified bounds
 * @param verticals
 * @param horizontals
 * @param bounds
 */
function rulersToGrid(verticals, horizontals, bounds) {
	const result = new Grid()
	verticals.sort((a, b) => a - b)
	horizontals.sort((a, b) => a - b)
	let lastX = bounds.left
	let lastY = bounds.top
	let column = 0
	let row = 0
	for (const y of horizontals) {
		for (const x of verticals) {
			result.set(row, column++, Rectangle.fromLTRB(lastX, lastY, x, y))
			lastX = x
		}
		// Last cell of the row
		result.set(row, column, Rectangle.fromLTRB(lastX, lastY, bounds.right, y))
		lastX = bounds.left
		lastY = y
		column = 0
		row++
	}
	lastX = bounds.left
	// Last fow of cells
	for (const x of verticals) {
		result.set(row, column++, Rectangle.fromLTRB(lastX, lastY, x, bounds.bottom))
		lastX = x
	}
	// Last cell of last row
	result.set(row, column, Rectangle.fromLTRB(lastX, lastY, bounds.right, bounds.bottom))
	return result
}

/**
 * Returns an array without repeated points
 * @param points
 */
function reducePoints(points) {
	const result = []
	const map = new Map()
	points.forEach(p => {
		const { x, y } = p
		const arr = map.get(y) || map.set(y, []).get(y)
		if (arr.indexOf(x) < 0) {
			arr.push(x)
		}
	})
	for (const [y, xs] of map) {
		for (const x of xs) {
			result.push(makePt(x, y))
		}
	}
	return result
}

/**
 * Returns a set of spots generated from the grid, avoiding colliding spots with specified obstacles
 * @param grid
 * @param obstacles
 */
function gridToSpots(grid, obstacles) {
	const obstacleCollision = p => obstacles.filter(o => o.contains(p)).length > 0
	const gridPoints = []
	for (const [row, data] of grid.data) {
		const firstRow = row == 0
		const lastRow = row == grid.rows - 1
		for (const [col, r] of data) {
			const firstCol = col == 0
			const lastCol = col == grid.columns - 1
			const nw = firstCol && firstRow
			const ne = firstRow && lastCol
			const se = lastRow && lastCol
			const sw = lastRow && firstCol
			if (nw || ne || se || sw) {
				gridPoints.push(r.northWest, r.northEast, r.southWest, r.southEast)
			} else if (firstRow) {
				gridPoints.push(r.northWest, r.north, r.northEast)
			} else if (lastRow) {
				gridPoints.push(r.southEast, r.south, r.southWest)
			} else if (firstCol) {
				gridPoints.push(r.northWest, r.west, r.southWest)
			} else if (lastCol) {
				gridPoints.push(r.northEast, r.east, r.southEast)
			} else {
				gridPoints.push(r.northWest, r.north, r.northEast, r.east, r.southEast, r.south, r.southWest, r.west, r.center)
			}
		}
	}
	// for(const r of grid) {
	//     gridPoints.push(
	//         r.northWest, r.north, r.northEast, r.east,
	//         r.southEast, r.south, r.southWest, r.west, r.center);
	// }
	// Reduce repeated points and filter out those who touch shapes
	return reducePoints(gridPoints).filter(p => !obstacleCollision(p))
}

/**
 * Creates a graph connecting the specified points orthogonally
 * @param spots
 */
function createGraph(spots) {
	const hotXs = []
	const hotYs = []
	const graph = new PointGraph()
	const connections = []
	spots.forEach(p => {
		const { x, y } = p
		if (hotXs.indexOf(x) < 0) {
			hotXs.push(x)
		}
		if (hotYs.indexOf(y) < 0) {
			hotYs.push(y)
		}
		graph.add(p)
	})
	hotXs.sort((a, b) => a - b)
	hotYs.sort((a, b) => a - b)
	const inHotIndex = p => graph.has(p)
	for (let i = 0; i < hotYs.length; i++) {
		for (let j = 0; j < hotXs.length; j++) {
			const b = makePt(hotXs[j], hotYs[i])
			if (!inHotIndex(b)) {
				continue
			}
			if (j > 0) {
				const a = makePt(hotXs[j - 1], hotYs[i])
				if (inHotIndex(a)) {
					graph.connect(a, b)
					graph.connect(b, a)
					connections.push({ a, b })
				}
			}
			if (i > 0) {
				const a = makePt(hotXs[j], hotYs[i - 1])
				if (inHotIndex(a)) {
					graph.connect(a, b)
					graph.connect(b, a)
					connections.push({ a, b })
				}
			}
		}
	}
	return { graph, connections }
}

/**
 * Solves the shotest path for the origin-destination path of the graph
 * @param graph
 * @param origin
 * @param destination
 */
function shortestPath(graph, origin, destination) {
	const originNode = graph.get(origin)
	const destinationNode = graph.get(destination)
	if (!originNode) {
		throw new Error(`Origin node {${origin.x},${origin.y}} not found`)
	}
	if (!destinationNode) {
		throw new Error(`Origin node {${origin.x},${origin.y}} not found`)
	}
	graph.calculateShortestPathFromSource(graph, originNode)
	return destinationNode.shortestPath.map(n => n.data)
}

/**
 * Given two segments represented by 3 points,
 * determines if the second segment bends on an orthogonal direction or not, and which.
 * @param a
 * @param b
 * @param c
 * @return Bend direction, unknown if not orthogonal or 'none' if straight line
 */
function getBend(a, b, c) {
	const equalX = a.x === b.x && b.x === c.x
	const equalY = a.y === b.y && b.y === c.y
	const segment1Horizontal = a.y === b.y
	const segment1Vertical = a.x === b.x
	const segment2Horizontal = b.y === c.y
	const segment2Vertical = b.x === c.x
	if (equalX || equalY) {
		return "none"
	}
	if (!(segment1Vertical || segment1Horizontal) || !(segment2Vertical || segment2Horizontal)) {
		return "unknown"
	}
	if (segment1Horizontal && segment2Vertical) {
		return c.y > b.y ? "s" : "n"
	} else if (segment1Vertical && segment2Horizontal) {
		return c.x > b.x ? "e" : "w"
	}
	throw new Error("Nope")
}

/**
 * Simplifies the path by removing unnecessary points, based on orthogonal pathways
 * @param points
 */
function simplifyPath(points) {
	if (points.length <= 2) {
		return points
	}
	const r = [points[0]]
	for (let i = 1; i < points.length; i++) {
		const cur = points[i]
		if (i === points.length - 1) {
			r.push(cur)
			break
		}
		const prev = points[i - 1]
		const next = points[i + 1]
		const bend = getBend(prev, cur, next)
		if (bend !== "none") {
			r.push(cur)
		}
	}
	return r
}

/**
 * Helps create the grid portion of the algorithm
 */
class Grid {
	constructor() {
		this._rows = 0
		this._cols = 0
		this.data = new Map()
	}

	set(row, column, rectangle) {
		this._rows = Math.max(this.rows, row + 1)
		this._cols = Math.max(this.columns, column + 1)
		const rowMap = this.data.get(row) || this.data.set(row, new Map()).get(row)
		rowMap.set(column, rectangle)
	}

	get(row, column) {
		const rowMap = this.data.get(row)
		if (rowMap) {
			return rowMap.get(column) || null
		}
		return null
	}

	rectangles() {
		const r = []
		for (const [, data] of this.data) {
			for (const [, rect] of data) {
				r.push(rect)
			}
		}
		return r
	}

	get columns() {
		return this._cols
	}

	get rows() {
		return this._rows
	}
}

/**
 * Main logic wrapped in a class to hold a space for potential future functionallity
 */
export class OrthogonalConnector {
	constructor() {
		this.byproduct = {
			hRulers: [],
			vRulers: [],
			spots: [],
			grid: [],
			connections: []
		}
	}

	getPoints(x, y, width, height) {
		return [
			{ name: "top", x: x + width / 2, y },
			{ name: "bottom", x: x + width / 2, y: y + height },
			{ name: "left", x, y: y + height / 2 },
			{ name: "right", x: x + width, y: y + height / 2 }
		]
	}

	assignSides(pointA, pointB) {
		if (!pointA.side || !pointB.side) {
			const sourcePoints = this.getPoints(pointA.shape.left, pointA.shape.top, pointA.shape.width, pointA.shape.height)
			const targetPoints = this.getPoints(pointB.shape.left, pointB.shape.top, pointB.shape.width, pointB.shape.height)
			let closestCombination = { source: null, target: null, distance: Infinity }
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 4; j++) {
					const distance = Math.sqrt(Math.pow(sourcePoints[i].x - targetPoints[j].x, 2) + Math.pow(sourcePoints[i].y - targetPoints[j].y, 2))
					if (distance < closestCombination.distance) {
						closestCombination = { source: sourcePoints[i].name, target: targetPoints[j].name, distance }
					}
				}
			}
			pointA.side = pointA.side || closestCombination.source
			pointB.side = pointB.side || closestCombination.target
		}
	}

	route(opts) {
		const { pointA, pointB, globalBoundsMargin } = opts
		this.assignSides(pointA, pointB)
		const spots = []
		const verticals = []
		const horizontals = []
		const sideA = pointA.side
		const sideAVertical = isVerticalSide(sideA)
		const sideB = pointB.side
		const sideBVertical = isVerticalSide(sideB)
		const originA = computePt(pointA)
		const originB = computePt(pointB)
		const shapeA = Rectangle.fromRect(pointA.shape)
		const shapeB = Rectangle.fromRect(pointB.shape)
		const bigBounds = Rectangle.fromRect(opts.globalBounds)
		let shapeMargin = opts.shapeMargin
		let inflatedA = shapeA.inflate(shapeMargin, shapeMargin)
		let inflatedB = shapeB.inflate(shapeMargin, shapeMargin)
		// Check bounding boxes collision
		if (inflatedA.intersects(inflatedB)) {
			shapeMargin = 0
			inflatedA = shapeA
			inflatedB = shapeB
		}
		const inflatedBounds = inflatedA.union(inflatedB).inflate(globalBoundsMargin, globalBoundsMargin)
		// Curated bounds to stick to
		const bounds = Rectangle.fromLTRB(
			Math.max(inflatedBounds.left, bigBounds.left),
			Math.max(inflatedBounds.top, bigBounds.top),
			Math.min(inflatedBounds.right, bigBounds.right),
			Math.min(inflatedBounds.bottom, bigBounds.bottom)
		)
		// Add edges to rulers
		for (const b of [inflatedA, inflatedB]) {
			verticals.push(b.left)
			verticals.push(b.right)
			horizontals.push(b.top)
			horizontals.push(b.bottom)
		}
		// Rulers at origins of shapes
		;(sideAVertical ? verticals : horizontals).push(sideAVertical ? originA.x : originA.y)
		;(sideBVertical ? verticals : horizontals).push(sideBVertical ? originB.x : originB.y)
		// Points of shape antennas
		for (const connectorPt of [pointA, pointB]) {
			const p = computePt(connectorPt)
			const add = (dx, dy) => spots.push(makePt(p.x + dx, p.y + dy))
			switch (connectorPt.side) {
				case "top":
					add(0, -shapeMargin)
					break
				case "right":
					add(shapeMargin, 0)
					break
				case "bottom":
					add(0, shapeMargin)
					break
				case "left":
					add(-shapeMargin, 0)
					break
			}
		}
		// Sort rulers
		verticals.sort((a, b) => a - b)
		horizontals.sort((a, b) => a - b)
		// Create grid
		const grid = rulersToGrid(verticals, horizontals, bounds)
		const gridPoints = gridToSpots(grid, [inflatedA, inflatedB])
		// Add to spots
		spots.push(...gridPoints)
		// Create graph
		const { graph, connections } = createGraph(spots)
		// Origin and destination by extruding antennas
		const origin = extrudeCp(pointA, shapeMargin)
		const destination = extrudeCp(pointB, shapeMargin)
		const start = computePt(pointA)
		const end = computePt(pointB)
		this.byproduct.spots = spots
		this.byproduct.vRulers = verticals
		this.byproduct.hRulers = horizontals
		this.byproduct.grid = grid.rectangles()
		this.byproduct.connections = connections
		const path = shortestPath(graph, origin, destination)
		if (path.length > 0) {
			return simplifyPath([start, ...shortestPath(graph, origin, destination), end])
		} else {
			return []
		}
	}
}
