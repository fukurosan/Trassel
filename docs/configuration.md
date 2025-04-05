## Configuration

?> Trassel allows you to configure both how your layout should be computed as well as manage your graph's data.

#### Layouts

Trassel comes with a layout engine that can be used both to produce incremental as well as static layouts. The engine comes with a number of configurable components for computing hierarchies, node clusters, grids and much more. You can finely control exactly how each node should be positioned, as well as write your own layout components. Incremental layout components are typically force-directed, and continuously computed, while static ones only execute once.

#### Data Management

Trassel has a built-in data manager that allows you to bring nodes online and offline. When a node is brought offline it is no longer exposed to the layout engine or other computations unless specifically instructed to do so. This means that if you have a large set of data you can feed everything into Trassel, but only choose to bring a specific set of nodes online at a time. Trassel can even do things like execute loops that bring adjacent nodes offline recursively given certain parameters. 

The data manager can access and compute information about the relationships between online nodes and offline nodes, which is typically helpful when building interactive applications. For example, *how many offline nodes are connected to online node "N1"*?

#### Renderer

Trassel comes with a WebGL powered graph renderer. The renderer can either be used in tandem with Trassels layout engine, or completely standalone. The renderer makes it easy to create high performance interactive visualizations.

There are several utility functions in trassel meant to support renderers, not only in terms of the layout engine. You can animate entire new coordinate states, compute information like hidden adjacent nodes, optimal new positions for nodes that are being brought online, and much more. Trassel is built to make life easier for the renderers, so they can focus more on visualization and less on data processing.

#### Community detection

Community detection can be used to compute groups of nodes within a graph. A community is a set of nodes that are densely connected to each other and loosely connected other nodes in the same graph. Trassel can also compute things like strongly connected components.

#### Path finding

Path finding is used to compute the fastest path between two nodes in a graph. Trassel supports both *weighted* and *unweighted*, as well as *directed* or *undirected* searching. 

#### Traversal
There are several utility traversal functions that allow you to write less boilerplate when operating on the data in your graph. Trassel can execute depth-first and breadth-first searches as well as do things like neighbor lookups given a variety of parameters. This makes it a lot easier to navigate and process data in the dataset.

---

# Options

Trassel's constructor accepts an options object where you can specify configuration settings. Below is a description of the different options. For more in depth information please check the corresponding pages.

All options can be changed after Trassel has been instantiated using functions on the Trassel instance.

```javascript
/** Options for Trassel */
interface IOptions {
	/** Options for the layout engine */
	layout?: ILayoutOptions
	/** Templates to apply to nodes and edges */
	templates?: GraphObjectTemplates
}

/** Options for the layout engine */
interface ILayoutOptions {
	/** Update cap (per second) for the force directed layout loops' updates. */
	updateCap?: number
	/** Layout's initial alpha value. I.e. how volatile is each movement. */
	alpha?: number
	/** Initial minimum alpha value. I.e. When going below this the layout loop terminate. */
	alphaMin?: number
	/** Initial decay rate for the layout. I.e. how less volatile does it get on each update. */
	alphaDecay?: number
	/** Alpha target for the layout. This determines what alpha value the layout engine wants to reach (and stay at). */
	alphaTarget?: number
	/** Velocity decay determines how quickly velocity decreases. I.e. the friction of nodes in the graph. */
	velocityDecay?: number
}

export interface GraphObjectTemplates {
	nodes: {
		/** Should match the "template" property on nodes to apply the template to */
		id: string
		/** A node object */
		template: TrasselNode
	}[]
	edges: {
		/** Should match the "template" property on edges to apply the template to */
		id: string
		/** An edge object */
		template: TrasselEdge
	}[]
}

```
