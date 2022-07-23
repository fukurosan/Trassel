import { Attraction, Collision, Link, NBody } from "./layout/layoutcomponents"
import Layout from "./layout"
import Graph from "./graph"

describe("End-to-End Tests", () => {
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
	})

	it("Typical layout loop works", async () => {
		const layout = new Layout(nodes, edges, { updateCap: Infinity })
		layout.addLayoutComponent("collide", new Collision())
		layout.addLayoutComponent("manybody", new NBody())
		layout.addLayoutComponent("x", new Attraction(true))
		layout.addLayoutComponent("y", new Attraction(false))
		layout.addLayoutComponent("link", new Link())
		let updateCount = 0
		layout.on("layoutupdate", () => {
			updateCount++
		})
		let resolve
		const promise = new Promise(promiseResolution => (resolve = promiseResolution))
		layout.on("layoutloopend", () => {
			resolve()
		})
		layout.start()
		await promise
		expect(updateCount).toEqual(300)
		expect(nodes).toMatchSnapshot("Typical layout setup")
	})

	it("Typical graph setup works", async () => {
		const graph = new Graph(nodes, edges, { layout: { updateCap: Infinity } })
		graph.addLayoutComponent("collide", new Collision())
		graph.addLayoutComponent("manybody", new NBody())
		graph.addLayoutComponent("x", new Attraction(true))
		graph.addLayoutComponent("y", new Attraction(false))
		graph.addLayoutComponent("link", new Link())
		let updateCount = 0
		graph.on("layoutupdate", () => {
			updateCount++
		})
		let resolve
		const promise = new Promise(promiseResolution => (resolve = promiseResolution))
		graph.on("layoutloopend", () => {
			resolve()
		})
		graph.startLayoutLoop()
		await promise
		expect(updateCount).toEqual(300)
		expect(nodes).toMatchSnapshot("Typical graph setup")
	})
})
