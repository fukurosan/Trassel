import { IBounds } from "./ibounds"
import { IGraphNode } from "./igraphnode"
import { IQuadrant } from "./iquadrant"

/** Quadtree class used for collision detection and approximation algorithms */
export interface IQuadtree {
	/** Has computeMass been executed? */
	isMassComputed: boolean
	/** Has computeLargestRadius been executed? */
	isLargestRadiusComputed: boolean
	/** All layout entities */
	entities: IGraphNode[]
	/** Top level quadrants */
	quadrants: IQuadrant
	/** Bounds of the quadtree */
	bounds: IBounds
	/** Records the largest radius contained in each quadrant and writes it to a .radius property */
	computeLargestRadius: () => void
	/** Records the total mass contained in each quadrant as well as the average x and y coordinates of contained nodes. */
	computeMass: () => void
}
