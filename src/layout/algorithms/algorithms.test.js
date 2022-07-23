import BaryCenter from "./barycenter"
import disjointGroups from "./disjointgroups"
import { makeAcyclic } from "./makeacyclic"
import { determineLevels } from "./determinelevels"
import { crossingMinimizationOrder } from "./crossingminimizationorder"
import { straightenEdges } from "./straightenedges"

describe("Layout Utility Algorithms", () => {
	it("BaryCenter sorting", () => {
		const nodes = [{ id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }, { id: "n5" }]
		const edges = [
			{ sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n1", targetNode: "n5" },
			{ sourceNode: "n2", targetNode: "n5" },
			{ sourceNode: "n3", targetNode: "n4" }
		]
		const stringNodes = JSON.stringify(nodes)
		const stringEdges = JSON.stringify(edges)
		const expectedOrder = [{ id: "n1" }, { id: "n2" }, { id: "n5" }, { id: "n3" }, { id: "n4" }]
		const actualOrder = BaryCenter(nodes, edges)
		expect(JSON.stringify(expectedOrder)).toEqual(JSON.stringify(actualOrder))
		//Confirm that data has not been mutated
		expect(stringNodes).toEqual(JSON.stringify(nodes))
		expect(stringEdges).toEqual(JSON.stringify(edges))
	})

	it("Make acyclic", () => {
		const nodes = [{ id: "n1" }, { id: "n2" }, { id: "n3" }]
		const edges = [
			{ sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n2", targetNode: "n3" },
			{ sourceNode: "n3", targetNode: "n1" }
		]
		const stringNodes = JSON.stringify(nodes)
		const stringEdges = JSON.stringify(edges)
		const expectedAcyclicEdges = [
			{ sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n2", targetNode: "n3" }
		]
		const actualEdgeIds = makeAcyclic(nodes, edges)
		expect(JSON.stringify(expectedAcyclicEdges)).not.toEqual(JSON.stringify(actualEdgeIds))
		//Confirm that data has not been mutated
		expect(stringNodes).toEqual(JSON.stringify(nodes))
		expect(stringEdges).toEqual(JSON.stringify(edges))
	})

	it("Disjoint groups", () => {
		const nodes = [{ id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }, { id: "n5" }]
		const edges = [
			{ sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n3", targetNode: "n4" }
		]
		const stringNodes = JSON.stringify(nodes)
		const stringEdges = JSON.stringify(edges)
		//prettier-ignore
		const expectedSubGraphs = [
			[{ id: "n1" }, { id: "n2" }],
			[{ id: "n3" }, { id: "n4" }],
			[{ id: "n5" }]
		]
		const actualGroups = disjointGroups(nodes, edges)
		expect(JSON.stringify(actualGroups)).toEqual(JSON.stringify(expectedSubGraphs))
		//Confirm that data has not been mutated
		expect(stringNodes).toEqual(JSON.stringify(nodes))
		expect(stringEdges).toEqual(JSON.stringify(edges))
	})

	it("Determine levels", () => {
		const nodes = [{ id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }, { id: "n5" }]
		const edges = [
			{ sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n1", targetNode: "n3" },
			{ sourceNode: "n3", targetNode: "n4" },
			{ sourceNode: "n1", targetNode: "n4" }
		]
		const stringNodes = JSON.stringify(nodes)
		const stringEdges = JSON.stringify(edges)
		//prettier-ignore
		const expectedOutputHierarchy = [
			[{ id: "n5" }],
			[{ id: "n1" }],
			[{ id: "n2" }, { id: "n3" }],
			[{ id: "n4" }],
		]
		//prettier-ignore
		const expectedFakeNodesHierarchy = [
			[],
			[{ id: "__FAKE_NODE__2n4n1" }],
			[],
			[]
		]
		const expectedFakeEdges = [
			{ sourceNode: "n1", targetNode: "__FAKE_NODE__2n4n1" },
			{ sourceNode: "__FAKE_NODE__2n4n1", targetNode: "n4" }
		]

		const { hierarchy, fakeNodesHierarchy, fakeEdges } = determineLevels(nodes, edges)
		expect(JSON.stringify(hierarchy)).toEqual(JSON.stringify(expectedOutputHierarchy))
		expect(JSON.stringify(expectedFakeNodesHierarchy)).toEqual(JSON.stringify(fakeNodesHierarchy))
		expect(JSON.stringify(expectedFakeEdges)).toEqual(JSON.stringify(fakeEdges))
		//Confirm that data has not been mutated
		expect(stringNodes).toEqual(JSON.stringify(nodes))
		expect(stringEdges).toEqual(JSON.stringify(edges))
	})

	it("Edge order (crossing minimization)", () => {
		const inputHierarchy = [
			[{ id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }, { id: "n5" }],
			[{ id: "n6" }, { id: "n7" }, { id: "n8" }, { id: "n9" }, { id: "n10" }]
		]
		const inputEdges = [
			{ sourceNode: "n1", targetNode: "n2" },
			{ sourceNode: "n1", targetNode: "n10" },
			{ sourceNode: "n2", targetNode: "n8" },
			{ sourceNode: "n3", targetNode: "n7" }
		]
		const stringNodes = JSON.stringify(inputHierarchy)
		const stringEdges = JSON.stringify(inputEdges)
		const expectedOutput = [
			[{ id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }, { id: "n5" }],
			[{ id: "n10" }, { id: "n8" }, { id: "n6" }, { id: "n7" }, { id: "n9" }]
		]
		const actualOutput = crossingMinimizationOrder(inputHierarchy, inputEdges)
		expect(JSON.stringify(actualOutput)).toEqual(JSON.stringify(expectedOutput))
		//Confirm that data has not been mutated
		expect(stringNodes).toEqual(JSON.stringify(inputHierarchy))
		expect(stringEdges).toEqual(JSON.stringify(inputEdges))
	})

	it("Straightens edges", () => {
		//prettier-ignore
		const inputHierarchy = [
			[{ id: "w1" }, { id: "n1" }, { id: "w2" }, { id: "w3" }, { id: "w4" }],
			[{ id: "n2" }, { id: "w5" }, { id: "w6" }                            ]
		]
		const inputEdges = [{ sourceNode: "n1", targetNode: "n2" }]
		const stringNodes = JSON.stringify(inputHierarchy)
		const stringEdges = JSON.stringify(inputEdges)
		//prettier-ignore
		const expectedOutput = [
			[{ id: "w1" }, { id: "n1" }, { id: "w2" }, { id: "w3" }, { id: "w4" }],
			[null,         { id: "n2" }, { id: "w5" }, { id: "w6" }, null        ]
		]
		const actualOutput = straightenEdges(inputHierarchy, inputEdges)
		expect(JSON.stringify(actualOutput)).toEqual(JSON.stringify(expectedOutput))
		//Confirm that data has not been mutated
		expect(stringNodes).toEqual(JSON.stringify(inputHierarchy))
		expect(stringEdges).toEqual(JSON.stringify(inputEdges))
	})
})
