import { IGraphNode } from "./nodesandedges"

/** An entity node in the Quadtree class */
export interface IQuadrantEntity {
	entity: IGraphNode
	next?: IQuadrantEntity
	mass?: number
	radius?: number
}
