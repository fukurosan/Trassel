import { NodeID, RendererEdge, RendererNode } from "./nodesandedges"

export type LineTypes = "line" | "taxi" | "orthogonal" | "cubicbezier"

/**
 * Options for the renderer
 */
export interface IRendererOptions {
	/** How the shape of the lines in the graph will look like */
	lineType?: LineTypes
	/** Color used for things like selection and hover states */
	primaryColor?: number | string
	/** Color of the graph backdrop */
	backdropColor?: number | string
	/** Should interactive edge labels be rotated? */
	rotateEdgeLabels?: boolean
}

//Event types fired by the renderer
interface PositionEvent {
	/** Position of the pointer */
	position: {
		/** X Coordinate */
		x: number
		/** Y Coordinate */
		y: number
	}
}
interface PositionDelta {
	/** How much the position moved */
	delta: {
		/** Pixels moved on the X-axis */
		x: number
		/** Pixels moved on the Y-axis */
		y: number
	}
}
interface NodeEvent {
	/** Node Object */
	node: RendererNode
}
interface EdgeEvent {
	/** Edge Object */
	edge: RendererEdge
}
interface LassoMovedEvent {
	/** Nodes added to the lasso selection */
	addedNodes: RendererNode[]
	/** Nodes removed from the lasso selection */
	removedNodes: RendererNode[]
	/** Edges added to the lasso selection */
	addedEdges: RendererEdge[]
	/** Edges removed from the lasso selection */
	removedEdges: RendererEdge[]
}
interface LassoSelection {
	/** The full current selection of IDs. Edge ids are stored as "sourceNode-targetNode" */
	selection: NodeID[]
}

/** Renderer events */
export interface RendererEvents {
	/** Fired when the backdrop is left clicked by the user */
	backdropclick: PositionEvent
	/** Fired when the backdrop is right clicked by the user */
	backdroprightclick: PositionEvent
	/** Fired when a node is left clicked */
	entityclick: NodeEvent & PositionEvent
	/** Fired when a node is right clicked */
	entityrightclick: NodeEvent & PositionEvent
	/** Fired when the pointer enters a node's hitbox */
	entityhoverstart: NodeEvent & PositionEvent
	/** Fired when the pointer moves around inside a node's hitbox */
	entityhovermove: NodeEvent & PositionEvent
	/** Fired when the pointer moves outside a node's hitbox */
	entityhoverend: NodeEvent
	/** Fired when a user begins draggins a node */
	entitydragstart: NodeEvent & PositionEvent
	/** Fired when a user drags a node to new coordinates */
	entitydragmove: NodeEvent & PositionEvent & PositionDelta
	/** Fired when a user has finished dragging a node */
	entitydragend: NodeEvent
	/** Fired when the pointer enters the hitbox of a interactive edge's label */
	edgelabelhoverstart: EdgeEvent & PositionEvent
	/** Fired when the pointer moves around inside the hitbox of a interactive edge's label */
	edgehovermove: EdgeEvent & PositionEvent
	/** Fired when the pointer exits the hitbox of a interactive edge's label */
	edgelabelhoverend: EdgeEvent
	/** Fired when a edge label is left clicked */
	edgelabelclick: EdgeEvent & PositionEvent
	/** Fired when a edge label is right clicked */
	edgelabelrightclick: EdgeEvent & PositionEvent
	/** Fired when the user begins dragging the canvas */
	canvasdragstart: void
	/** Fired when the user stops dragging the canvas */
	canvasdragend: void
	/** Fired when a lasso selection has been initialized by the user */
	lassostart: void
	/** Fired when a new lasso selection has been made */
	lassoupdate: LassoMovedEvent & LassoSelection
	/** Fired after a lasso selection has completed */
	lassoend: LassoSelection
}

export type RendererEventCallaback<T extends keyof RendererEvents> = (event: RendererEvents[T]) => any
