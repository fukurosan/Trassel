import DataManager from "./datamanager"

describe("Data Manager", () => {
	let nodes = []
	let edges = []
	beforeEach(() => {
		nodes = [{ id: "n0" }, { id: "n1" }, { id: "n2" }, { id: "n3" }]
		edges = [
			{ sourceNode: "n0", targetNode: "n0" },
			{ sourceNode: "n0", targetNode: "n1" },
			{ sourceNode: "n1", targetNode: "n0" },
			{ sourceNode: "n0", targetNode: "n3" },
			{ sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n2", targetNode: "n0" },
			{ sourceNode: "n2", targetNode: "n3" }
		]
	})

	it("Data structures are correctly computed", () => {
		//Data structures are correctly computed based on input data
		const dataManager = new DataManager(nodes, edges)
		expect(dataManager.allNodes.length).toEqual(nodes.length)
		expect(dataManager.allEdges.length).toEqual(edges.length)
		expect(dataManager.sourceToTargetMap.get("n0").length).toEqual(3)
		expect(dataManager.sourceToTargetMap.get("n3").length).toEqual(0)
		expect(dataManager.targetToSourceMap.get("n0").length).toEqual(3)
		expect(dataManager.nodeToNeighborsMap.get("n0").length).toEqual(4)
		expect(dataManager.nodeLookupMap.get("n0")).toEqual(nodes[0])
		expect(dataManager.edgeIndexes.get(edges[2]).total).toEqual(2)
		expect(dataManager.edgeIndexes.get(edges[2]).index).toEqual(1)
		expect(dataManager.offlineEdgeCounter.get("n0").sourceNode).toEqual(0)
		expect(dataManager.offlineEdgeCounter.get("n0").targetNode).toEqual(0)
		expect(dataManager.offlineEdgeCounter.get("n0").internal).toEqual(0)
		expect(dataManager.onlineNodes.size).toEqual(4)
		expect(dataManager.getOnlineNodes().length).toEqual(4)
		expect(dataManager.getOnlineEdges().length).toEqual(7)
		//Bringing nodes online and offline works
		dataManager.bringNodesOffline(["n0"])
		expect(dataManager.offlineEdgeCounter.get("n2").sourceNode).toEqual(1)
		expect(dataManager.onlineNodes.size).toEqual(3)
		expect(dataManager.getOnlineNodes().length).toEqual(3)
		expect(dataManager.getOnlineEdges().length).toEqual(2)
		expect(dataManager.getOfflineNodes().length).toEqual(1)
		expect(dataManager.getOfflineEdges().length).toEqual(5)
		expect(dataManager.isEdgeOnline(edges[0])).toEqual(false)
		//Computing neighbors based on parameters works
		expect(dataManager.getNeighbors("n2", false, false, true).length).toEqual(3)
		expect(dataManager.getNeighbors("n2", false, true, true).length).toEqual(2)
		expect(dataManager.getNeighbors("n2", true, true, true).length).toEqual(1)
		dataManager.bringAllNodesOnline()
		expect(dataManager.onlineNodes.size).toEqual(4)
	})

	it("Implosion and explosion are correctly computed", () => {
		//In order to test the leaf functionality we remove all edges that connect to n3 except n2
		edges = edges.filter(edge => edge.targetNode !== "n3" || edge.sourceNode === "n2")
		const dataManager = new DataManager(nodes, edges)
		const singleUndirectedImplosion = dataManager.computeImplodeOrExplodeNode("n1", false, false, "single")
		const recursiveUndirectedImplosion = dataManager.computeImplodeOrExplodeNode("n1", false, false, "recursive")
		const leafsUndirectedImplosion = dataManager.computeImplodeOrExplodeNode("n2", false, false, "leafs")
		const singleDirectedImplosion = dataManager.computeImplodeOrExplodeNode("n1", false, true, "single")
		const recursiveDirectedImplosion = dataManager.computeImplodeOrExplodeNode("n1", false, true, "recursive")
		const leafsDirectedImplosion = dataManager.computeImplodeOrExplodeNode("n2", false, true, "leafs")
		//Single Undirected Implosion
		expect(singleUndirectedImplosion.length).toEqual(2)
		expect(singleUndirectedImplosion).toContainEqual("n0")
		expect(singleUndirectedImplosion).toContainEqual("n2")
		//Recursive Undirected Implosion
		expect(recursiveUndirectedImplosion.length).toEqual(3)
		expect(recursiveUndirectedImplosion).toContainEqual("n0")
		expect(recursiveUndirectedImplosion).toContainEqual("n2")
		expect(recursiveUndirectedImplosion).toContainEqual("n3")
		//Leafs Undirected Implosion
		expect(leafsUndirectedImplosion.length).toEqual(1)
		expect(leafsUndirectedImplosion[0]).toEqual("n3")
		//Single Directed Implosion
		expect(singleDirectedImplosion.length).toEqual(2)
		expect(singleDirectedImplosion).toContainEqual("n0")
		expect(singleDirectedImplosion).toContainEqual("n2")
		//Recursive Directed Implosion
		expect(recursiveDirectedImplosion.length).toEqual(3)
		expect(recursiveDirectedImplosion).toContainEqual("n0")
		expect(recursiveDirectedImplosion).toContainEqual("n2")
		expect(recursiveDirectedImplosion).toContainEqual("n3")
		//Leafs Directed Implosion
		expect(leafsDirectedImplosion.length).toEqual(1)
		expect(leafsDirectedImplosion[0]).toEqual("n3")
	})

	it("Node position staging is correctly computed", () => {
		//We add a few leaf nodes in order to test the leaf staging
		nodes.push({ id: "nx1" })
		nodes.push({ id: "nx2" })
		edges.push({ sourceNode: "n1", targetNode: "nx1" })
		edges.push({ sourceNode: "n1", targetNode: "nx2" })
		//We also need to add coordinates and edge distances in order for this function to work.
		nodes.forEach((node, index) => {
			node.x = index * 10
			node.y = index * 10
		})
		edges.forEach(edge => {
			edge.distance = 5
		})
		const dataManager = new DataManager(nodes, edges)
		//First we test a node that will get average coordinates based on neighbors
		dataManager.bringNodesOffline(["n1"])
		const nodeWithAverageCoordinates = dataManager.stageNodePositions(["n1"])
		const n0 = nodes[0]
		const n2 = nodes[2]
		const nx1 = nodes.find(node => node.id === "nx1")
		const nx2 = nodes.find(node => node.id === "nx2")
		const expectedX = (n0.x + n2.x + nx1.x + nx2.x) / 4
		const expectedY = (n0.y + n2.y + nx1.y + nx2.y) / 4
		expect(nodeWithAverageCoordinates.length).toEqual(1)
		expect(nodeWithAverageCoordinates[0].id).toEqual("n1")
		expect(nodeWithAverageCoordinates[0].x).toEqual(expectedX)
		expect(nodeWithAverageCoordinates[0].y).toEqual(expectedY)
		//Next we test leaf nodes that would be positioned in an even circle around its only neighbor
		dataManager.bringAllNodesOnline()
		dataManager.bringNodesOffline(["nx1", "nx2"])
		const nodesWithTargetedPosition = dataManager.stageNodePositions(["nx1", "nx2"])
		expect(nodesWithTargetedPosition.length).toEqual(2)
		expect(nodesWithTargetedPosition[0].id).toEqual("nx1")
		expect(Math.round(nodesWithTargetedPosition[0].x)).toEqual(-299)
		expect(Math.round(nodesWithTargetedPosition[0].y)).toEqual(6)
		expect(nodesWithTargetedPosition[1].id).toEqual("nx2")
		expect(Math.round(nodesWithTargetedPosition[1].x)).toEqual(301)
		expect(Math.round(nodesWithTargetedPosition[1].y)).toEqual(-4)
	})

	it("Find shortest path unweighted works", () => {
		//prettier-ignore
		const shortestPathNodes = [
			{ id: "n0" }, { id: "n1" }, { id: "n2" }, { id: "n3" },
			{ id: "n4" }, { id: "n5" }, { id: "n6" }, { id: "n7" }
		]
		//prettier-ignore
		const shortestPathEdges = [
			{ sourceNode: "n0", targetNode: "n1" }, { sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n2", targetNode: "n3" }, { sourceNode: "n3", targetNode: "n4" },
			{ sourceNode: "n4", targetNode: "n5" }, { sourceNode: "n5", targetNode: "n6" },
			{ sourceNode: "n4", targetNode: "n6" }, { sourceNode: "n0", targetNode: "n0" },
			{ sourceNode: "n6", targetNode: "n0" },
		]
		const dataManager = new DataManager(shortestPathNodes, shortestPathEdges)
		const shortestPathDirected = dataManager.findShortestPathUnweighted("n0", "n6", true, true)
		const shortestPathUndirected = dataManager.findShortestPathUnweighted("n0", "n6", true, false)
		const impossiblePath = dataManager.findShortestPathUnweighted("n0", "n7", true, false)
		expect(shortestPathDirected.length).toEqual(6)
		expect(shortestPathDirected.join("")).toEqual("n0n1n2n3n4n6")
		expect(shortestPathUndirected.length).toEqual(2)
		expect(shortestPathUndirected.join("")).toEqual("n0n6")
		expect(impossiblePath).toBeNull()
	})

	it("Find shortest path weighted (Dijkstra) works", () => {
		//prettier-ignore
		const shortestPathNodes = [
			{ id: "n0" }, { id: "n1" }, { id: "n2" }, { id: "n3" },
			{ id: "n4" }, { id: "n5" }, { id: "n6" }, { id: "n7" }
		]
		//prettier-ignore
		const shortestPathEdges = [
			{ sourceNode: "n0", targetNode: "n1", weight: 1 }, { sourceNode: "n1", targetNode: "n2", weight: 1 },
			{ sourceNode: "n2", targetNode: "n3", weight: 1 }, { sourceNode: "n3", targetNode: "n4", weight: 1 },
			{ sourceNode: "n4", targetNode: "n5", weight: 1 }, { sourceNode: "n5", targetNode: "n6", weight: 1 },
			{ sourceNode: "n4", targetNode: "n6", weight: 1 }, { sourceNode: "n0", targetNode: "n0", weight: 1 },
			{ sourceNode: "n6", targetNode: "n0", weight: 1000 }, { sourceNode: "n0", targetNode: "n1", weight: 1000 },
		]
		const dataManager = new DataManager(shortestPathNodes, shortestPathEdges)
		const shortestPathDirected = dataManager.findShortestPathWeighted("n0", "n6", true, true, false)
		const shortestPathUndirected = dataManager.findShortestPathWeighted("n0", "n6", true, false, false)
		const shortestPathDirectedAggregated = dataManager.findShortestPathWeighted("n0", "n6", true, true, true)
		const shortestPathUndirectedAggregated = dataManager.findShortestPathWeighted("n0", "n6", true, false, true)
		const impossiblePath = dataManager.findShortestPathWeighted("n0", "n7", true, false)
		//Directed
		expect(shortestPathDirected.length).toEqual(6)
		expect(shortestPathDirected.map(path => path.id).join("")).toEqual("n0n1n2n3n4n6")
		expect(shortestPathDirected[shortestPathDirected.length - 1].weight).toEqual(5)
		//Undirected
		expect(shortestPathUndirected.length).toEqual(6)
		expect(shortestPathUndirected.map(path => path.id).join("")).toEqual("n0n1n2n3n4n6")
		expect(shortestPathUndirected[shortestPathUndirected.length - 1].weight).toEqual(5)
		//Aggregated weights directed
		expect(shortestPathDirectedAggregated.length).toEqual(6)
		expect(shortestPathDirectedAggregated.map(path => path.id).join("")).toEqual("n0n1n2n3n4n6")
		expect(shortestPathDirectedAggregated[shortestPathDirectedAggregated.length - 1].weight).toEqual(1005)
		//Aggregated weights undirected
		expect(shortestPathUndirectedAggregated.length).toEqual(2)
		expect(shortestPathUndirectedAggregated.map(path => path.id).join("")).toEqual("n0n6")
		expect(shortestPathUndirectedAggregated[shortestPathUndirectedAggregated.length - 1].weight).toEqual(1000)
		//Impossible path
		expect(impossiblePath).toBeNull()
	})

	it("Computing stronly connected components (Kosaraju) works", () => {
		nodes = [{ id: "n0" }, { id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }]
		edges = [
			{ sourceNode: "n0", targetNode: "n1" },
			{ sourceNode: "n0", targetNode: "n3" },
			{ sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n2", targetNode: "n0" },
			{ sourceNode: "n2", targetNode: "n3" }
		]
		const dataManager = new DataManager(nodes, edges)
		const components = dataManager.computeStronglyConnectedComponents(true)
		expect(components.length).toEqual(3)
		expect(components.some(component => component.length === 3)).toBeTruthy()
		expect(components.some(component => component.length === 1)).toBeTruthy()
		expect(components.find(component => component.length === 3).join("")).toEqual("n0n2n1")
	})

	it("BFS works", () => {
		nodes = [{ id: "n0" }, { id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }, { id: "n5" }]
		edges = [
			{ sourceNode: "n0", targetNode: "n1" },
			{ sourceNode: "n0", targetNode: "n2" },
			{ sourceNode: "n1", targetNode: "n3" },
			{ sourceNode: "n1", targetNode: "n4" },
			{ sourceNode: "n3", targetNode: "n5" }
		]
		const dataManager = new DataManager(nodes, edges)
		const order = []
		dataManager.BFS("n0", node => {
			order.push(node)
		})
		const canceledOrder = []
		dataManager.BFS("n0", node => {
			canceledOrder.push(node)
			return true
		})
		expect(order.length).toEqual(6)
		expect(order.join("")).toEqual("n0n1n2n3n4n5")
		expect(canceledOrder.length).toEqual(1)
	})

	it("DFS works", () => {
		nodes = [{ id: "n0" }, { id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }, { id: "n5" }, { id: "n6" }, { id: "n7" }]
		edges = [
			{ sourceNode: "n0", targetNode: "n1" },
			{ sourceNode: "n0", targetNode: "n2" },
			{ sourceNode: "n1", targetNode: "n3" },
			{ sourceNode: "n1", targetNode: "n4" },
			{ sourceNode: "n2", targetNode: "n5" },
			{ sourceNode: "n2", targetNode: "n6" },
			{ sourceNode: "n6", targetNode: "n7" }
		]
		const dataManager = new DataManager(nodes, edges)
		const order = []
		dataManager.DFS("n0", node => {
			order.push(node)
		})
		const canceledOrder = []
		dataManager.DFS("n0", node => {
			canceledOrder.push(node)
			return true
		})
		expect(order.length).toEqual(8)
		expect(order.join("")).toEqual("n0n1n3n4n2n5n6n7")
		expect(canceledOrder.length).toEqual(1)
	})
})
