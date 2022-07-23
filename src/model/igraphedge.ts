import { IBasicEdge } from "./ibasicedge"
import { IGraphNode } from "./igraphnode"
import { NodeID } from "./nodeid"

/** Internal edge structure */
export interface IGraphEdge extends IBasicEdge {
	/** Index for the edge in the list of edges */
	index: number
	/** Actual source node object */
	source: IGraphNode
	/** Actual target node object */
	target: IGraphNode
	/** Strength of the edge */
	strength: number
	/** How long is the edge */
	distance: number
	/** How long is the visible section of the edge? */
	visibleDistance: number
	/** How heavy is the edge */
	weight: number
}
