import { LayoutNode } from "./nodesandedges"

/** An entity node in the Quadtree class */
export interface IQuadrantEntity {
	entity: LayoutNode
	next?: IQuadrantEntity
	mass?: number
	radius?: number
}
