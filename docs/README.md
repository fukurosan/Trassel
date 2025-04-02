# Getting started

## What is Trassel?

Trassel is a JavaScript graph computing tool.

Trassel is built with simplicity in mind, enabling engineers who may not be familiar with graph theory to easily implement powerful visualization and analytics tools in their applications and backends. 

Trassel consists of a data manager that allows you to control what subset of your data is exposed at any given time, a customizable and expandable layout engine, a WebGL powered renderer, as well as a number of utilities like community detection and path finding. The library can be used both for data exploration as well as for powering advanced visualizations.

## Why use Trassel?
- Powerful and expandable layout engine
- Built-in data manager
- WebGL powered renderer
- Tons of utility functions
- Makes life easier for renderers
- Compatible with most runtime environments
- Simple to use
  
---

> ## Installation

Install using npm:

```bash
$ npm install trassel
```

Load using a script element:
```html
<script src="https://unpkg.com/trassel"></script>
```

!> **Tip**  
*If you load the library bundle using a script element then a global variable called `Trassel` will be created. All examples in these docs use standard ES import statements, but in this case you can omit these and instead access the necessary parts of the library by using `Trassel.X.*`

```html
<script>
//No
import { Trassel } from "trassel"
//Yes
Trassel.Trassel
</script>
```

!> **Tip**  
*With the commonjs build you can also use require statements like so:*
```javascript
const { Trassel } = require("trassel")
```

---

> ## Using the library

Initializing a graph with the library is extremely easy:

```javascript
import { Trassel } from "trassel"

const nodes = [{ id: "n1" }, { id: "n2" }]
const edges = [{ sourceNode: "n1", targetNode: "n2" }]
const graph = new Trassel(nodes, edges)
//The graph object can now be used to produce layouts, analytics and much more.
```

> ## Nodes and edges

Nodes represent points in your graph, and an edge is a link that binds two nodes together.

The most basic type of node and edge looks as such:

```javascript
declare type NodeID = string | number
export interface BasicNode {
	id: NodeID
}
export interface BasicEdge {
	sourceNode: NodeID
	targetNode: NodeID
}
```

Internally Trassel will compute and add additional properties to the objects, although these can also be provided and manipulated from the outside. Note that the input objects for the graph will be mutated, and converted into this new data structure.

Check out these interfaces:
```javascript
/** Internal node structure */
declare type NodeID = string | number
/** Trassel node */
interface TrasselNode {
	/** Unique ID of node */
	id: NodeID
	/** Template for object, used for shared properties */
	template?: string
	/** Index for the node in the list of nodes */
	index: number
	/** Shape of the node */
	shape: NodeShape
	/** Mass of the node */
	mass: number
	/** X coordinate */
	x: number
	/** Y coordinate */
	y: number
	/** Fixed X coordinate (always trumps X) */
	fx?: number | null
	/** Fixed Y coordinate (always trumps Y) */
	fy?: number | null
	/** Node velocity (current movement) on the X-axis  */
	vx: number
	/** Node velocity (current movement) on the Y-axis */
	vy: number
	/** Renderer options */
	rendererOptions?: {
		/** Name of the node */
		label?: string
		/** Optional icon URL */
		icon?: string
		/** Background color of the node */
		backgroundColor?: string
		/** Text color of the node */
		textColor?: string
	}
}
/** Internal edge structure */
export interface ITrasselEdge {
	/** Where the edge is directed from */
	targetNode: NodeID
	/** Where the edge is directed to */
	sourceNode: NodeID
	/** Template for object, used for shared properties */
	template?: string
	/** Index for the edge in the list of edges */
	index: number
	/** Actual source node object */
	source: TrasselNode
	/** Actual target node object */
	target: TrasselNode
	/** Strength of the edge */
	strength: number
	/** How long is the edge */
	distance: number
	/** How long is the visible section of the edge? */
	visibleDistance: number
	/** Weight of the edge, typically used in path finding and community computations to determine the significance of the edge */
	weight: number
	/** Renderer options */
	rendererOptions?: {
		/** Label text for the edge */
		label?: string
		/** Should the edge be dotted? */
		dotted?: boolean
		/** Color of the edge */
		color?: string
		/** Background color of the edge label */
		labelBackgroundColor?: string
		/** Text color of the edge label */
		labelTextColor?: string
		/** Is the label interactive? */
		isInteractive?: boolean
		/** In an orthogonal line type this can be used to control where the lines start and end */
		sourceEdgePosition?: "top" | "right" | "bottom" | "left"
		/** In an orthogonal line type this can be used to control where the lines start and end */
		targetEdgePosition?: "top" | "right" | "bottom" | "left"
		/** Marker to be drawn on the source side of the edge */
		markerSource?: "arrow" | "hollowArrow" | "none"
		/** Marker to be drawn on the target side of the edge */
		markerTarget?: "arrow" | "hollowArrow" | "none"
	}
}
```

---
