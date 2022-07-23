import { IQuadrant } from "./iquadrant"
import { IQuadrantEntity } from "./iquadrantentity"

/** A member of a quadrant in a quadtree */
declare type QuadMember = IQuadrantEntity | IQuadrant
export { QuadMember }
