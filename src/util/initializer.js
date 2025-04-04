import { Env } from "../config/env"
import { applyTemplateToObject } from "./jsonutility"

/**
 * Takes simple format nodes and edges and converts them into GraphNodes and Edges
 * @param {import("../model/nodesandedges").DraftNode[]} nodes
 * @param {import("../model/nodesandedges").DraftEdge[]} edges
 * @param {import("../model/nodesandedges").GraphObjectTemplates} templates
 * @returns { { nodes: import("../model/nodesandedges").TrasselNode[] edges: import("../model/nodesandedges").TrasselEdge[] } }
 */
export const initializeNodesAndEdges = (nodes = [], edges = [], templates = {}) => {
	const nodeTemplates = Array.isArray(templates.nodes) ? templates.nodes : []
	const edgeTemplates = Array.isArray(templates.edges) ? templates.edges : []
	//Initialize Nodes
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]
		//Apply template
		if (node.template) {
			const template = nodeTemplates.find(template => template.id === node.template)
			if (template) {
				applyTemplateToObject(node, template.template)
			}
		}
		//Add index property
		node.index = i
		//If no shape is set then attempt to set it
		if (!node.shape) {
			node.shape = {
				id: "circle",
				radius: Env.DEFAULT_NODE_RADIUS
			}
		} else if (!node.shape.radius) {
			node.shape.radius = node.shape.width ? Math.max(node.shape.width, node.shape.height) / 2 : Env.DEFAULT_NODE_RADIUS
		}
		//If no mass is set then attempt to set it
		node.mass = node.mass ? node.mass : Env.DEFAULT_NODE_MASS
		//If fixed coordinates exist, set regular to the same values
		if (node.fx) {
			node.x = node.fx
		}
		if (node.fy) {
			node.y = node.fy
		}
		//If no x or y coordinates exist then set a position based on a circle of nodes
		if (isNaN(node.x) || isNaN(node.y)) {
			//For smaller graphs a smaller hard set radius seems to render better incremental layouts
			const radius = (nodes.length > Env.NODE_COUNT_INIT_BREAKPOINT ? node.shape.radius : 10) * Math.sqrt(0.5 + i)
			const angle = i * (Math.PI * (3 - Math.sqrt(5)))
			node.x = radius * Math.cos(angle)
			node.y = radius * Math.sin(angle)
		}
		//If no velocity is set, initialize it to 0
		if (isNaN(node.vx) || isNaN(node.vy)) {
			node.vx = 0
			node.vy = 0
		}
	}

	//Initialize Edges
	for (let i = 0; i < edges.length; i++) {
		const edge = edges[i]
		//Apply template
		if (edge.template) {
			const template = edgeTemplates.find(template => template.id === edge.template)
			if (template) {
				applyTemplateToObject(edge, template.template)
			}
		}
		//Add index property
		edge.index = i
		//If no strength has been configured then set it to a default value
		if (!edge.strength) {
			edge.strength = Env.DEFAULT_EDGE_STRENGTH
		}
		//Map the nodes to source & target (and evaluate that they exist!)
		//Note that source and target are necessary for D3 adapters to work
		edge.source = nodes.find(node => node.id === edge.sourceNode)
		edge.target = nodes.find(node => node.id === edge.targetNode)
		if (!edge.source || !edge.target) {
			throw new Error("Broken Edge " + `${edge.sourceNode} -> ${edge.targetNode}`)
		}
		//Initialize the edge's length
		if (!edge.distance) {
			const invisibleDistance = edge.target.shape.radius + edge.source.shape.radius
			edge.distance = invisibleDistance + (edge.visibleDistance ? edge.visibleDistance : Env.DEFAULT_VISIBLE_EDGE_DISTANCE)
		}
		if (!edge.visibleDistance) {
			edge.visibleDistance = edge.distance - edge.target.shape.radius - edge.source.shape.radius
		}
		//Initialize the edge's weight
		if (isNaN(edge.weight)) {
			edge.weight = Env.DEFAULT_EDGE_WEIGHT
		}
	}
	return {
		nodes,
		edges
	}
}
