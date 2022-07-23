import { initializeNodesAndEdges } from "../util/initializer"
import Quadtree from "../util/quadtree"
import { Animation, Attraction, BoundingBox, Center, Cluster, Collision, Fan, Grid, Hierarchy, Link, Matrix, NBody, Radial } from "./layoutcomponents"

describe("Layout Components", () => {
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

	const ALPHA = 0.5
	const VELOCITY_DECAY = 0.6
	const applyVelocity = nodes => {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]
			if (node.fx == null) {
				node.vx *= VELOCITY_DECAY //Velocity decay
				node.x += node.vx
			} else {
				node.x = node.fx
				node.vx = 0
			}
			if (node.fy == null) {
				node.vy *= VELOCITY_DECAY //Velocity decay
				node.y += node.vy
			} else {
				node.y = node.fy
				node.vy = 0
			}
		}
	}

	let nodes
	let edges
	beforeEach(() => {
		nodes = JSON.parse(baseNodes)
		edges = JSON.parse(baseEdges)
		initializeNodesAndEdges(nodes, edges)
	})

	it("Animation component", () => {
		const component = new Animation(1000, 1000, 0.1, true)
		let stop = false
		const removeFn = () => (stop = true)
		nodes[1].targetX = 1100
		nodes[1].targetY = 1100
		component.initialize([nodes[0], nodes[1]], [], { remove: removeFn })
		for (let i = 0; i < 300; i++) {
			if (stop) break
			component.execute(ALPHA)
			applyVelocity([nodes[0], nodes[1]])
		}
		expect(JSON.stringify([nodes[0], nodes[1]])).toMatchSnapshot("Animation component")
		expect(stop).toEqual(true)
	})

	it("Attraction component", () => {
		const component1 = new Attraction(true, 0, 1)
		const component2 = new Attraction(false, 0, 1)
		component1.initialize(nodes, edges, {})
		component2.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component1.execute(ALPHA)
			component2.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Attraction component")
	})

	it("BoundingBox component", () => {
		const component = new BoundingBox(30, 30)
		component.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("BoundingBox component")
	})

	it("Center component", () => {
		const component = new Center(0, 0)
		component.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Center component")
	})

	it("Cluster component", () => {
		const component = new Cluster()
		component.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Cluster component")
	})

	it("Collision component", () => {
		const component = new Collision(1, 5)
		const quadtree = new Quadtree(nodes)
		component.initialize(nodes, edges, { quadtree })
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
			quadtree.update()
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Collision component")
	})

	it("Fan component", () => {
		let index = 0
		const determineGroup = () => {
			const group = index
			index++
			index > 2 && (index = 0)
			return group
		}
		const component = new Fan(determineGroup, undefined, undefined, 0, 0)
		component.initialize(nodes, edges)
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Fan component")
	})

	it("Grid component", () => {
		const component = new Grid(true, true)
		component.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Grid component")
	})

	it("Hierarchy component", () => {
		const component = new Hierarchy(undefined, undefined, undefined, undefined, 0, 0)
		component.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Hierarchy component")
	})

	it("Link component", () => {
		const component = new Link()
		component.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Link component")
	})

	it("Matrix component", () => {
		const component = new Matrix(undefined, 0, 0)
		component.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Matrix component")
	})

	it("N-body component", () => {
		const component = new NBody()
		const quadtree = new Quadtree(nodes)
		component.initialize(nodes, edges, { quadtree })
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
			quadtree.update()
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("NBody component")
	})

	it("Radial component", () => {
		const component = new Radial(undefined, 0, 0)
		component.initialize(nodes, edges, {})
		for (let i = 0; i < 300; i++) {
			component.execute(ALPHA)
			applyVelocity(nodes)
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Radial component")
	})

	it("Typical component setup", () => {
		const components = [new Collision(), new NBody(), new Attraction(true), new Attraction(false), new Link()]
		const utils = {
			quadtree: new Quadtree(nodes)
		}
		components.forEach(component => component.initialize(nodes, edges, utils))
		for (let i = 0; i < 300; i++) {
			for (let j = 0; j < components.length; j++) {
				components[j].execute(ALPHA)
			}
			applyVelocity(nodes)
			utils.quadtree.update()
		}
		expect(JSON.stringify(nodes)).toMatchSnapshot("Typical component Setup")
	})
})
