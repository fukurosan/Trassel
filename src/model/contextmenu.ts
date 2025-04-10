import { TrasselNode, TrasselEdge } from "./nodesandedges"

export interface section {
	label: string
	icon?: string
	action: ((...args: any) => any) | contextMenu[]
}

export type contextMenu = (section | "divider")[]

export type contextMenuBuilderInputTypes = TrasselNode | TrasselEdge | null

export type contextMenuBuilder = (data: contextMenuBuilderInputTypes) => contextMenu
