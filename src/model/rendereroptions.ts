import { IBasicEdge } from "./ibasicedge"
import { IBasicNode } from "./ibasicnode"

export interface IRendererOptions {
	/** How the shape of the lines in the graph will look like */
	lineType?: "line" | "taxi" | "orthogonal" | "cubicbezier"
	/** Color used for things like selection and hover states */
	primaryColor?: number
	/** Color of the graph backdrop */
	backdropColor?: number
}

export interface INodeRendererOptions {
	/** Background of the node */
	backgroundColor?: number
	/** Text color of the node */
	textColor?: number
	/** Shape of the node */
	shape?: "circle" | "rectangle"
	/** Icon URL/URI */
	icon?: string
	/** Text label (name) for the node */
	label?: string
}

export interface IEdgeRendererOptions {
	/** Marker to be drawn on the source side of the edge */
	markerSource?: "arrow" | "hollowArrow" | "none"
	/** Marker to be drawn on the target side of the edge */
	markerTarget?: "arrow" | "hollowArrow" | "none"
	/** Text label (name) for the edge */
	label?: string
	/** Text color */
	labelColor?: number
	/** Text label background color */
	labelBackgroundColor?: number
	/** Is the label interactive? */
	isInteractive?: boolean
	/** In an orthogonal line type this can be used to control where the lines start and end */
	sourceEdgePosition?: "top" | "right" | "bottom" | "left"
	/** In an orthogonal line type this can be used to control where the lines start and end */
	targetEdgePosition?: "top" | "right" | "bottom" | "left"
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
