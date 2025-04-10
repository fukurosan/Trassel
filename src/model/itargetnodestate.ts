import { NodeID } from "./nodesandedges"

/** Node state representing a node ID and target coordinates */
export interface ITargetNodeState {
	id: NodeID,
	sourceX: number,
	sourceY: number,
	targetX: number,
	targetY: number
}
