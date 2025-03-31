export type LineTypes = "line" | "taxi" | "orthogonal" | "cubicbezier"

export interface IRendererOptions {
	/** How the shape of the lines in the graph will look like */
	lineType?: LineTypes
	/** Color used for things like selection and hover states */
	primaryColor?: number | string
	/** Color of the graph backdrop */
	backdropColor?: number | string
}
