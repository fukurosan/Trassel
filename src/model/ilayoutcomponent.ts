import { IQuadtree } from "./iquadtree"
import { IGraphNode } from "./igraphnode"
import { IGraphEdge } from "./igraphedge"

/** Interface for layout forces */
export interface ILayoutComponent {
	initialize: (nodes: IGraphNode[], edges: IGraphEdge[], utils: ILayoutComponentUtilities) => void
	execute: (alpha: number) => void
	dismount: () => void
}

/** Utilities provided to forces during initialization */
interface ILayoutComponentUtilities {
	quadtree: IQuadtree
	remove: () => void
}
