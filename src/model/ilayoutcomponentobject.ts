import { ILayoutComponent } from "./ilayoutcomponent"
import { IGraphEdge } from "./igraphedge"
import { IGraphNode } from "./igraphnode"

/** Internal force object structure for the layout engine */
export interface ILayoutComponentObject {
	id: string
	instance: ILayoutComponent
	nodeBindings: (node: IGraphNode) => boolean
	edgeBindings: (edge: IGraphEdge) => boolean
}
