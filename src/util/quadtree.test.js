import Quadtree from "./quadtree"
import { Env } from "../config/env"
import { initializeNodesAndEdges } from "./initializer"

describe("Quadtree", () => {
	//prettier-ignore
	const nodes = [
		{ id: "n1" },
		{ id: "n2" },
		{ id: "n3" },
		{ id: "n4" },
		{ id: "n5" },
		{ id: "n6" },
		{ id: "n7" },
		{ id: "n8" },
		{ id: "n9" },
		{ id: "n10" }
	]
	nodes[0].radius = 1000
	initializeNodesAndEdges(nodes, [])

	it("Quadtree bounds fill all nodes", () => {
		const minX = nodes.reduce((acc, node) => (node.x < acc ? node.x : acc), 0)
		const minY = nodes.reduce((acc, node) => (node.y < acc ? node.x : acc), 0)
		const maxX = nodes.reduce((acc, node) => (node.x > acc ? node.x : acc), 0)
		const maxY = nodes.reduce((acc, node) => (node.y > acc ? node.x : acc), 0)
		const quadtree = new Quadtree(nodes)
		expect(quadtree.bounds.xStart).toBeLessThan(minX)
		expect(quadtree.bounds.yStart).toBeLessThan(minY)
		expect(quadtree.bounds.xEnd).toBeGreaterThan(maxX)
		expect(quadtree.bounds.yEnd).toBeGreaterThan(maxY)
	})

	it("Quadtree is square", () => {
		const quadtree = new Quadtree(nodes)
		expect(quadtree.bounds.xEnd - quadtree.bounds.xStart).toEqual(quadtree.bounds.yEnd - quadtree.bounds.yStart)
	})

	it("Quadtree computes mass correctly", () => {
		const quadtree = new Quadtree(nodes)
		quadtree.computeMass()
		expect(quadtree.quadrants.mass).toEqual(Env.DEFAULT_NODE_MASS * nodes.length)
	})

	it("Quadtree computes largest radius correctly", () => {
		let quadtree = new Quadtree(nodes)
		quadtree.computeLargestRadius(1)
		expect(quadtree.quadrants.radius).toEqual(1001)
		quadtree = new Quadtree(nodes)
		quadtree.computeLargestRadius()
		expect(quadtree.quadrants.radius).toEqual(1000)
	})

	it("Quadrants are correctly computed", () => {
		const quadtree = new Quadtree(nodes)
		expect(quadtree.quadrants).toMatchSnapshot()
	})

	it("Traverses bottom to top", () => {
		const quadtree = new Quadtree(nodes)
		const notSeen = new Set(nodes.map(node => node.id))
		quadtree.traverseBottomTop(node => {
			node?.entity?.id && notSeen.delete(node.entity.id)
		})
		expect(notSeen.size).toBe(0)
	})

	it("Traverses top to bottom", () => {
		const quadtree = new Quadtree(nodes)
		let counter = 0
		quadtree.traverseTopBottom(() => counter++)
		expect(counter).toBe(4)
	})
})
