import { IGraphNode } from "./igraphnode"

/** An entity node in the Quadtree class */
export interface IQuadrantEntity {
	entity: IGraphNode
	next?: IQuadrantEntity
	mass?: number
	radius?: number
}
