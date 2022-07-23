import { QuadMember } from "./quadmember"

/** A quadrant in the Quadtree class */
export interface IQuadrant {
	0?: QuadMember
	1?: QuadMember
	2?: QuadMember
	3?: QuadMember
	mass?: number
	radius?: number
}
