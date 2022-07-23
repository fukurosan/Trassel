import { NodeID } from "./nodeid"

/** Minimum configuration edges */
export interface IBasicEdge {
	/** Where the edge is directed from */
	sourceNode: NodeID
	/** Where the edge is directed to */
	targetNode: NodeID
}
