import { initializeNodesAndEdges } from "./initializer"

describe("Initializer", () => {
	const baseNodes = JSON.stringify([
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
	])
	const baseEdges = JSON.stringify([
		{ sourceNode: "n1", targetNode: "n2" },
		{ sourceNode: "n1", targetNode: "n3" },
		{ sourceNode: "n1", targetNode: "n4" },
		{ sourceNode: "n2", targetNode: "n5" },
		{ sourceNode: "n2", targetNode: "n5" },
		{ sourceNode: "n5", targetNode: "n6" },
		{ sourceNode: "n5", targetNode: "n6" },
		{ sourceNode: "n6", targetNode: "n1" },
		{ sourceNode: "n8", targetNode: "n9" },
		{ sourceNode: "n9", targetNode: "n10" }
	])

	let nodes
	let edges
	beforeEach(() => {
		nodes = JSON.parse(baseNodes)
		edges = JSON.parse(baseEdges)
		initializeNodesAndEdges(nodes, edges)
	})

	it("Initializes nodes correctly", () => {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]
			expect(typeof node.index).toEqual("number")
			expect(typeof node.x).toEqual("number")
			expect(typeof node.y).toEqual("number")
			expect(typeof node.vx).toEqual("number")
			expect(typeof node.vy).toEqual("number")
			expect(typeof node.radius).toEqual("number")
			expect(typeof node.mass).toEqual("number")
		}
	})

	it("Initializes edges correctly", () => {
		for (let i = 0; i < edges.length; i++) {
			const edge = edges[i]
			expect(typeof edge.index).toEqual("number")
			expect(typeof edge.strength).toEqual("number")
			expect(typeof edge.source).toEqual("object")
			expect(edge.source).not.toBeNull()
			expect(typeof edge.target).toEqual("object")
			expect(edge.target).not.toBeNull()
			expect(typeof edge.distance).toEqual("number")
			expect(typeof edge.weight).toEqual("number")
		}
	})
})
