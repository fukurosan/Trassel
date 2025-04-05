import { Container } from "../../node_modules/pixi.js/lib/scene/container/Container"
import { Graphics } from "../../node_modules/pixi.js/lib/scene/graphics/shared/Graphics"
import { Sprite } from "../../node_modules/pixi.js/lib/scene/sprite/Sprite"

/** Makes a set of properties on a type required */
type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
	[Property in Key]-?: Type[Property]
}

/** Types of markers that the renderer can render for edges */
export type EdgeMarkerTypes = "arrow" | "hollowArrow" | "none"

/** Positions in an orthogonal rendering of edges where an edge can start and end relative to a source or target node */
export type OrthogonalEdgePositions = "top" | "right" | "bottom" | "left"

/** Node IDs can be either strings or number */
export type NodeID = string | number

/** Shapes that nodes can be of */
export type NodeShape =
	| {
			id: "rectangle"
			height: number
			width: number
			radius: number
	  }
	| {
			id: "circle"
			radius: number
	  }

/** Minimum configuration nodes */
export interface IBasicNode {
	/** Unique identifier for the node */
	id: NodeID
}

/** Minimum configuration edges */
export interface IBasicEdge {
	/** Where the edge is directed from */
	sourceNode: NodeID
	/** Where the edge is directed to */
	targetNode: NodeID
}

/** Trassel node */
export interface TrasselNode extends IBasicNode {
	/** Template for object, used for shared properties */
	template?: string
	/** Index for the node in the list of nodes */
	index: number
	/** Shape of the node */
	shape: NodeShape
	/** Mass of the node */
	mass: number
	/** X coordinate */
	x: number
	/** Y coordinate */
	y: number
	/** Fixed X coordinate (always trumps X) */
	fx?: number | null
	/** Fixed Y coordinate (always trumps Y) */
	fy?: number | null
	/** Node velocity (current movement) on the X-axis  */
	vx: number
	/** Node velocity (current movement) on the Y-axis */
	vy: number
	/** Renderer options */
	rendererOptions?: {
		/** Name of the node */
		label?: string
		/** Optional icon URL */
		icon?: string
		/** Background color of the node */
		backgroundColor?: string
		/** Text color of the node */
		textColor?: string
	}
	/** Renderer internals (generated by the renderer) */
	rendererInternals?: {
		container: Container
		node: Graphics
		text: null
		icon: null
		selected: Graphics
		isFocused: false
		isSelected: false
	}
}

/** Trassel Edge */
export interface TrasselEdge extends IBasicEdge {
	/** Template for object, used for shared properties */
	template?: string
	/** Index for the edge in the list of edges */
	index: number
	/** Actual source node object */
	source: TrasselNode
	/** Actual target node object */
	target: TrasselNode
	/** Strength of the edge */
	strength: number
	/** How long is the edge */
	distance: number
	/** How long is the visible section of the edge? */
	visibleDistance: number
	/** Weight of the edge, typically used in path finding and community computations to determine the significance of the edge */
	weight: number
	/** Renderer options */
	rendererOptions?: {
		/** Label text for the edge */
		label?: string
		/** Color of the edge */
		color?: string
		/** Background color of the edge label */
		labelBackgroundColor?: string
		/** Text color of the edge label */
		labelTextColor?: string
		/** Is the label interactive? */
		isInteractive?: boolean
		/** In an orthogonal line type this can be used to control where the lines start and end */
		sourceEdgePosition?: OrthogonalEdgePositions
		/** In an orthogonal line type this can be used to control where the lines start and end */
		targetEdgePosition?: OrthogonalEdgePositions
		/** Marker to be drawn on the source side of the edge */
		markerSource?: EdgeMarkerTypes
		/** Marker to be drawn on the target side of the edge */
		markerTarget?: EdgeMarkerTypes
	}
	/** Renderer internals (generated by the renderer) */
	rendererInternals?: {
		container: Container
		line: Graphics
		markerSource: Sprite
		markerTarget: Sprite
		text: null | Container
		isFocused: boolean
		edgeCounter: {
			total: number
			index: number
		}
	}
}

/** Partial Trassel node for the Layout engine */
export type LayoutNode = Pick<TrasselNode, "id" | "index" | "shape" | "template" | "mass" | "x" | "y" | "fx" | "fy" | "vx" | "vy">
/** Partial Trassel node for the renderer */
export type RendererNode = Pick<TrasselNode, "id" | "shape" | "x" | "y" | "rendererOptions">
/** Partial Trassel node for the renderer internally */
export type InternalRendererNode = WithRequiredProperty<RendererNode & Pick<TrasselNode, "rendererInternals">, "rendererInternals">

/** Partial Trassel edge for the Layout engine */
export type LayoutEdge = Pick<
	TrasselEdge,
	"distance" | "index" | "source" | "sourceNode" | "target" | "targetNode" | "template" | "strength" | "visibleDistance" | "weight"
> & {
	source: LayoutNode
	target: LayoutNode
}
/** Partial Trassel edge for the renderer */
export type RendererEdge = Pick<TrasselEdge, "source" | "sourceNode" | "target" | "targetNode" | "rendererOptions"> & {
	source: RendererNode
	target: RendererNode
}
/** Partial Trassel edge for the renderer internally */
export type InternalRendererEdge = WithRequiredProperty<
	RendererEdge &
		Pick<TrasselEdge, "rendererInternals"> & {
			source: InternalRendererNode
			target: InternalRendererNode
		},
	"rendererInternals"
>

/** A draft for a trassel node */
export type DraftNode = Partial<TrasselNode> & IBasicNode
/** A draft for a trassel edge */
export type DraftEdge = Partial<TrasselEdge> & IBasicEdge

/** A template for a Trassel node */
export type NodeTemplate = Partial<Pick<TrasselNode, "shape" | "mass" | "rendererOptions">>
/** A template for a Trassel edge */
export type EdgeTemplate = Partial<Pick<TrasselEdge, "strength" | "weight" | "distance" | "visibleDistance" | "rendererOptions">>
/** A collection of node and edge templates */
export interface GraphObjectTemplates {
	nodes: {
		/** Should match the "template" property on nodes to apply the template to */
		id: string
		template: NodeTemplate
	}[]
	edges: {
		/** Should match the "template" property on edges to apply the template to */
		id: string
		template: EdgeTemplate
	}[]
}
