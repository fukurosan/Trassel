import { IBasicEdge } from "./ibasicedge"
import { IBasicNode } from "./ibasicnode"

export type LineTypes = "line" | "taxi" | "orthogonal" | "cubicbezier"
export type NodeShapes = "circle" | "rectangle"
export type MarkerTypes = "arrow" | "hollowArrow" | "none"
export type EdgePositions = "top" | "right" | "bottom" | "left"

export interface IRendererOptions {
	/** How the shape of the lines in the graph will look like */
	lineType?: LineTypes
	/** Color used for things like selection and hover states */
	primaryColor?: number | string
	/** Color of the graph backdrop */
	backdropColor?: number | string
}

export interface INodeRendererOptions {
	/** Background of the node */
	backgroundColor?: number | string
	/** Text color of the node */
	textColor?: number | string
	/** Shape of the node */
	shape?: NodeShapes
	/** Icon URL/URI */
	icon?: string
	/** Text label (name) for the node */
	label?: string
}

export interface IEdgeRendererOptions {
	/** Marker to be drawn on the source side of the edge */
	markerSource?: MarkerTypes
	/** Marker to be drawn on the target side of the edge */
	markerTarget?: MarkerTypes
	/** Text label (name) for the edge */
	label?: string
	/** Text color */
	labelColor?: number | string
	/** Text label background color */
	labelBackgroundColor?: number | string
	/** Is the label interactive? */
	isInteractive?: boolean
	/** In an orthogonal line type this can be used to control where the lines start and end */
	sourceEdgePosition?: EdgePositions
	/** In an orthogonal line type this can be used to control where the lines start and end */
	targetEdgePosition?: EdgePositions
}

/**
 * Basic node format for the renderer
 */
export interface INodeWithRendererOptions extends IBasicNode {
	/** Options for the renderer */
	renderer?: INodeRendererOptions
	/** Radius (if circle) */
	radius?: number
	/** Width (if rectangle) */
	width?: number
	/** Height (if rectangle) */
	height?: number
}

/**
 * Basic edge format for the renderer
 */
export interface IEdgeWithRendererOptions extends IBasicEdge {
	/** Options for the renderer */
	renderer?: INodeRendererOptions
	/** Length (in px) of the edge */
	distance?: number
}
