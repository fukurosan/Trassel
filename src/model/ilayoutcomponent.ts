import { IQuadtree } from "./iquadtree"
import { LayoutNode, LayoutEdge } from "./nodesandedges"

/** Interface for layout forces */
export interface ILayoutComponent {
	initialize: (nodes: LayoutNode[], edges: LayoutEdge[], utils: ILayoutComponentUtilities) => void
	execute: (alpha: number) => void
	dismount: () => void
}

/** Utilities provided to forces during initialization */
interface ILayoutComponentUtilities {
	quadtree: IQuadtree
	remove: () => void
}
