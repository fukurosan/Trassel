import { IBasicNode } from "./ibasicnode"

/** Internal node structure */
export interface IGraphNode extends IBasicNode {
	/** Index for the node in the list of nodes */
	index: number
	/** Radius for node */
	radius: number
	/** Optional width (if node is square!) */
	width?: number
	/** Optional height (if node is square!) */
	height?: number
	/** Mass of the node */
	mass: number
	/** X coordinate */
	x: number
	/** Y coordinate */
	y: number
	/** Fixed X coordinate (always trumps X) */
	fx: number|null
	/** Fixed Y coordinate (always trumps Y) */
	fy: number|null
	/** Node velocity (current movement) on the X-axis  */
	vx: number
	/** Node velocity (current movement) on the Y-axis */
	vy: number
}
