import { ILayoutComponent } from "./ilayoutcomponent"
import { IGraphNode, IGraphEdge } from "./nodesandedges"

/** Internal force object structure for the layout engine */
export interface ILayoutComponentObject {
	id: string
	instance: ILayoutComponent
	nodeBindings: (node: IGraphNode) => boolean
	edgeBindings: (edge: IGraphEdge) => boolean
}
