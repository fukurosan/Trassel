# WebGL Renderer

Trassel comes with a basic graph renderer based on WebGL. The built-in renderer can be used either in combination with the rest of Trassel or stand-alone.

## Using the renderer

To use the renderer is super simple. You need to provide a element for the renderer to mount in (which must have space in it!), and a list of nodes and edges with a bit of meta data inside. For more exact information about the data format check the bottom of this page.

Check out this simple example:

```html
<div class="graph" style="width:800px;height:600px;"></div>
<script>
	import { Trassel, Renderer } from "trassel"

	const nodes = [
	        {id: "n1", x: -100, y: 0},
	        {id: "n2", x: 0, y: 0},
	        {id: "n3", x: 100, y: 0}
	    ]
	const edges = [
	    {sourceNode: "n1", targetNode: "n2"},
	    {sourceNode: "n2", targetNode: "n1"},
	]
	const graph = new Trassel(nodes, edges)
	const element = document.querySelector(".element-to-place-graph-in")
	const renderer = new Renderer(element, graph.getNodes(), graph.getEdges())
	await renderer.initialize()
	renderer.render()
</script>
```

---

## Basics

When you create an instance of the renderer you pass a reference to an element where the renderer should mount its canvas, as well as an optional list of nodes, list of edges, and an options object.

to update data after creating the graph simply use the updateNodesAndEdges() function like so:

```javascript
const nodes = []
const edges = []
await renderer.updateNodesAndEdges(nodes, edges)
```

To render the current state onto the screen use the render() function like so:

```javascript
renderer.render()
```

When removing the component from the DOM it is generally a good idea to execute the dismount() function which is a cleanup function. This function does things like remove resize observers from parent elements.

```javascript
renderer.dismount()
```

!> **About dependency**  
_Trassel has one single dependency, which is pixi.js. This dependency is used as an abstraction layer for WebGL to power the built-in renderer._

## Interaction

There are various means of interacting with the renderer and the content on the screen. You can use these different tools to create visualizations and user interactions.

### Pan and zoom

The Trassel renderer's canvas is by default panable and zoomable using the pointer (mouse or touch). This means that you can pan around the canvas by dragging the backdrop with the mouse, and zoom using either a scroll wheel or scroll gestures. You can also programmatically interact with the renderer like so:

```javascript
//Zoom to a scale that fits all nodes into the screen and center the graph.
renderer.zoomToFit()
//Sets the transform of the graph to a specific set of coordinates and scale.
//The provided coordinates are measured from the center of the canvas element.
renderer.setTransform(0, 0, 1)
```

You can extract coordinates from the renderer, and convert between viewport coordinates and local coordinates (i.e. the coordinate system within the graph).

```javascript
//Convert viewport coordinates to local coordinates
const { x, y } = renderer.viewportToLocalCoordinates(0, 0)
//Convert local coordinates to viewport coordinates
const { x, y } = renderer.localToViewportCoordinates(0, 0)
```

You can also add zoom buttons to the canvas by providing the "zoomControls" options parameter in the Renderer's constructor. 

### Selection

Selecting nodes is a common type of interaction in network visualization tools. You can instruct Trassel's renderer to select (highlight) nodes in the graph with an outline. This can be combined with event listeners to create powerful interactions with minimal code.

Selecting a node is super simple:

```javascript
//Must be a reference to a node that has been loaded in the renderer(!)
const node = { id: "n1" }
//The second argument sets the selection status.
//If no second argument is passed the current status will be toggled to its opposite.
//Use toggleSelectEdges for edges
renderer.toggleSelectNodes([someNode], true)
//To clear all selections:
//Use clearAllEdgeSelections for edges (or clearAllSelections for all)
renderer.clearAllNodeSelections()
//You can also combine it with events like so:
//Use edgelabelclick for edge labels
renderer.on("entityclick", event => {
	renderer.clearAllNodeSelections()
	renderer.toggleSelectNode(event.node)
})
renderer.on("backdropclick", () => {
	renderer.clearAllNodeSelections()
})
```

#### Selection Lasso

Another typical scenario in network graph visualizations is to use lassos to select several nodes at once. The Trassel renderer comes with a built-in lasso that can be toggled on and off. When toggled on a lasso will follow the mouse as it moves across the canvas when dragged until it is toggled off again. While toggled on events will fire when nodes enter or exit the lasso space.

Here's an example of triggering it when the user holds down the shift key

```javascript
let shiftKey = false
const keyListener = event => {
	shiftKey = event.shiftKey
	if (shiftKey) renderer.toggleLasso(true)
	else renderer.toggleLasso(false)
}
window.addEventListener("keydown", keyListener)
window.addEventListener("keyup", keyListener)
renderer.on("lassoupdate", event => {
	//The lasso update event comes with a list of added and removed nodes from inside the lasso.
	renderer.toggleSelectNodes([...event.addedNodes, ...event.removedNodes])
	renderer.toggleSelectEdges([...event.addedEdges, ...event.removedEdges])
})
```

### Interactive edges

Edges are by default not interactive, but can be toggled as interactive by setting a flag in the renderer property of the edge object like so:

```javascript
const edge = { sourceNode: "n0", targetNode: "n0", (...) rendererOptions: { isInteractive: true } },
```

When made interactive edges will trigger click and hover events, and will receive a hover effect just like nodes. Only interactive edges will fully respect provided color options.

### Disabling nodes

It is possible to instruct Trassel to disable nodes in the graph, causing them to become grayed out and uninteractable. This is a great way of highlighting data in the graph.

To use the functionality you provide a function that takes a node as an argument and returns a boolean. All connected edges will also be automatically disabled.

```javascript
const disabledNodes = new Set(["n0", "n1"])
const disableFn = node => {
	return disabledNodes.has(node.id)
}
//Disable nodes
renderer.disableNodes(disableFn)
//Clear all disabled statuses
renderer.clearAllDisabledStatuses()
```

## Line types

The look and feel of edges' lines can be configured using the linetype option. This can either be passed to the constructor or be set using the setLineType function.

```javascript
import { Renderer } from "trassel"
const renderer = new Renderer(element, nodes, edges, { lineType: "taxi" })
//Possible options are "line", "taxi", "orthogonal" or "cubicbezier"
renderer.setLineType("line")
```

## Markers

By default the Trassel renderer will draw an arrow head marker on the target side of each edge, and nothing on the source side. This can be configured in the edge data by providing a sourceMarker and targetMarker property inside the renderer property object.

```javascript
//Possible options are "arrow", "hollowArrow", or "none"
const edgeWithNoMarkers = { sourceNode: "n0", targetNode: "n0", rendererOptions: { markerSource: "none", markerTarget: "none" } }
```

## Context Menus

You can easily add context menus by providing a contextMenuBuilder parameter to the renderer's options in the constructor.

The provided should be a function that return a valid context menu strucutre, given an object as input.

When executed your function will receive either a node, edge, or null (in the case of the canvas) and from this information you build the menu you want to see. The menu structure is an array of items, where each item has a label property, optional icon property, and an action. The action can either be a function (in which case it will be executed when the button is clicked) or a new menu (in which case it will become a sub-menu when the parent one is hovered). It is also possible to provide a string value of "divider" as an item in the array, which will create a line separating previous and following items.

For example:
```javascript
const contextMenuBuilder = (entity) => {
	return [
		{
			label: "Button 1"
			icon: "icon-url",
			action: () => console.log("hello world")
		},
		"divider",
		{
			label: "Button 2"
			icon: "icon-url",
			action: [
				{
					label: "Button 2.1"
					icon: "icon-url",
					action: () => console.log("hello world")
				}
			]
		},
	]
}
new Trassel(element, nodes, edges, { contextMenuBuilder })
```


## Events

use the renderer.on("eventname", callback) function to register event listeners on the renderer.

The following events can be listened to:

| Event Name          | Description                                           |
| ------------------- | ----------------------------------------------------- |
| backdropclick       | Fired when the backdrop is clicked                    |
| backdroprightclick  | Fired when the backdrop is right clicked              |
| entityclick         | Fired when a node is clicked                          |
| entityrightclick    | Fired when a node is right clicked                    |
| entityhoverstart    | Fired when a node is hovered                          |
| entityhoverend      | Fired when a node is no longer hovered                |
| entitydragstart     | Fired when a drag operation of a node is started      |
| entitydragmove      | Fired when a node is dragged                          |
| entitydragend       | Fired when a drag operation of a node is ended        |
| edgelabelhoverstart | Fired when an edge label is hovered                   |
| edgelabelhoverend   | Fired when an edge label is no longer hovered         |
| edgelabelclick      | Fired when an edge label is clicked                   |
| edgelabelrightclick | Fired when an edge label is right clicked             |
| canvasdragstart     | Fired when a drag operation of the canvas is started  |
| canvasdragend       | Fired when a drag operation of the canvas is started  |
| lassostart          | Fired when the lasso is triggered by a drag operation |
| lassoupdate         | Fired when the nodes covered by the lasso changes     |
| lassoend            | Fired when the lasso interaction ends                 |

## API

Some interfaces:

```javascript
interface IRendererOptions {
	/** How the shape of the lines in the graph will look like */
	lineType?: "line" | "taxi" | "orthogonal" | "cubicbezier"
	/** Color used for things like selection and hover states */
	primaryColor?: number
	/** Color of the graph backdrop */
	backdropColor?: number
	/** Should interactive edge labels be rotated? */
	rotateEdgeLabels?: boolean
	/** Should the zoom controls be activated? */
	zoomControls?: boolean
	/** Context Menu Builder */
	contextMenuBuilder?: ContextMenu
}

type ContextMenu = (data: INodeWithRendererOptions | IEdgeWithRendererOptions | null) => ("divider" | {
	label: string
	icon?: string
	action: ((...args: any) => any) | ContextMenu[]
})[]

/** Can be set on node objects using "rendererOptions" */
interface INodeRendererOptions {
	/** Name of the node */
	label?: string
	/** Optional icon URL */
	icon?: string
	/** Background color of the node */
	backgroundColor?: string
	/** Text color of the node */
	textColor?: string
}

/** Can be set on edge objects using "rendererOptions" */
interface IEdgeRendererOptions {
	/** Label text for the edge */
	label?: string
	/** Color of the edge */
	color?: string
	/** Background color of the edge label */
	labelBackgroundColor?: string
	/** Text color of the edge label */
	labelTextColor?: string
	/** Is the label interactive? */
	isInteractive?: boolean
	/** In an orthogonal line type this can be used to control where the lines start and end */
	sourceEdgePosition?: OrthogonalEdgePositions
	/** In an orthogonal line type this can be used to control where the lines start and end */
	targetEdgePosition?: OrthogonalEdgePositions
	/** Marker to be drawn on the source side of the edge */
	markerSource?: EdgeMarkerTypes
	/** Marker to be drawn on the target side of the edge */
	markerTarget?: EdgeMarkerTypes
}

/**
 * Basic node format for the renderer
 */
interface INodeWithRendererOptions {
	/** Unique identifier for the node */
    id: string | number
	/** X coordinate */
	x: number
	/** Y coordinate */
	y: number
    /** Options for the renderer */
	rendererOptions?: INodeRendererOptions
	/** Shape of the node */
	shape: { 
		id: "circle" | "rectangle"
		radius: number
		width?: number
		height?: number
	}
}

/**
 * Basic edge format for the renderer
 */
interface IEdgeWithRendererOptions {
	/** Unique identifier of the source node */
    sourceNode: string | number
    /** Unique identifier of the target node */
	targetNode: string | number
	/** Source node */
	source: INodeWithRendererOptions
	/** Target node */
	target: INodeWithRendererOptions
    /** Options for the renderer */
	rendererOptions?: IEdgeRendererOptions
}
```
