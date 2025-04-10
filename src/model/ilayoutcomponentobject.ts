import { ILayoutComponent } from "./ilayoutcomponent"
import { LayoutNode, LayoutEdge } from "./nodesandedges"

/** Internal force object structure for the layout engine */
export interface ILayoutComponentObject {
	id: string
	instance: ILayoutComponent
	nodeBindings: (node: LayoutNode) => boolean
	edgeBindings: (edge: LayoutEdge) => boolean
}
