# Layout Engine

Trassel comes with a layout engine that can be used both to produce interactive as well as static layouts. The engine comes with a number of configurable tools for computing hierarchies, node clusters, grids and much more. You can finely control exactly how each node should be positioned, as well as write your own layout components.

## How it works

The layout engine uses layout components to compute node positions either statically or incrementally through a simplified [velocity verlet](https://en.wikipedia.org/wiki/Verlet_integration) numerical method. Layout components can produce a variety of effects on nodes, such as pull certain nodes closer together, pull them apart, prevent collisions, form patterns, and much more. Trassel comes with a number of different components that fill a majority of use cases, but you can also develop your own components and apply them to your layout. 

There are two types of components: incremental and static. Incremental components are force-directed, and will affect nodes by updated their `.vx` and .`vy` values (velocity). Static layouts affect nodes' `.fx` and `.fy` coordinates (fixed), ignoring velocity and only requiring a single update to produce an optimal position. The two types of components are able to operate side by side in the layout. 

## Loop and updates

The layout engine can either be executed as a continuously running loop, or iterations (updates) can be manually triggered. The first is great for creating interactive visualizations, while the latter works well for computing static layouts.

The layout computation uses a number of values to determine the outcome of the next update. Alpha, alphaTarget, alphaDecay, and velocityDecay. On each update it increases the current alpha value by alphaTarget - alpha * alphaDecay, and then invokes layout components in provided order. After all components have completed computing, velocities (`.vx` and `.vy`) are decreased by (velocity * velocityDecay) and applied to node coordinates (`.x`, `.y`). If fixed coordinates have been set (`.fx`, `.fy`) then these will override all other values. To clarify, the alpha value determines the volatility of the current update, the target is the direction of the alpha value throughout updates, and the alphaDecay is the rate at which the alpha value decays. 

If a loop is being executed then it will end when the alphaTarget 0 is reached. This means that if a positive alphaTarget is provided then the loop will eventually reach said target and then stay at this alpha value until manually stopped. For most purposes the default values for these parameters should be sufficient, but manually updating the the alpha and alphaTarget values is commonplace.

You can register event listeners to the layout engine to listen for updates, and loops starting / ending.

Check out this example:

```javascript
const graph = new Trassel(nodes, edges, options)
graph.on("layoutloopstart", () => {
	console.log("The layout update loop has started!")
})
graph.on("layoutupdated", () => {
	console.log("The layout was updated!")
})
graph.on("layoutloopend", () => {
	console.log("The layout update loop has ended!")
})
//Starting the loop
graph.startLayoutLoop()
//Stopping the loop (manually)
graph.stopLayoutLoop()
//Updating the layout manually (the boolean determines is an event is sent)
graph.updateLayout(true)
```

You can manually change parameters for the loop and updates. Here are a few things that are configurable:

| Variable       | Description                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| update cap     | Update Cap for the layout loops' updates.                                                                     |
| alpha          | Layout's initial alpha value. I.e. how volatile is each movement.                                             |
| alpha mininmum | Initial minimum alpha value. I.e. When going below this the layout loop terminate.                            |
| alpha decay    | Initial decay rate for the layout. I.e. how less volatile does it get on each update.                         |
| alpha target   | Alpha target for the layout. This determines what alpha value the layout engine wants to reach (and stay at). |
| velocity decay | Velocity decay determines how quickly velocity decreases. I.e. the friction of nodes in the graph.            |

This can either be configured through the initial options object or by accessing functions on the trassel instance like so:
```javascript
const trassel = new Trassel(nodes, edges, options)
trassel.setLayoutAlpha(0.4)
trassel.setLayoutAlphaTarget(0.2)
```

## Components

A layout component is a class instance that implements trassel's ILayoutComponent interface. Each component is required to have a unique identifier, and some components can accept parameters to configure their behavior.

When adding a component to trassel's layout engine you can provide node and edge bindings to determine what nodes and edges should be exposed to the component. These bindings are simply function references that each take a node or edge as an input argument and returns true or false depending on if the node/edge should be included. If no bindings are provided then all nodes and edges in the layout will be exposed to the component.

Adding or removing a layout component is super simple:

```javascript
import { LayoutComponents, Trassel } from "trassel
const trassel = new Trassel(nodes, edges)
//All layout components classes are exported on the "LayoutComponents" object.
const nBodyComponent = new LayoutComponents.NBody()
//Global component
trassel.addLayoutComponent("nbody", nBodyComponent)
trassel.removeLayoutComponent("nbody")
//Specific to a set of nodes/edges
const nodeBindings = (node) => true
const edgeBindings = (edge) => true
trassel.addLayoutComponent("nbody", nBodyComponent, nodeBindings, edgeBindings)
trassel.removeLayoutComponent("nbody")
```

## Trassel Components

The following components ship with Trassel.

### NBody
***Type: Incremental***

The Nbody comonent can be used to create repulsion or attraction between nodes in the graphs. A node's `mass` property is used to determine how strong its repulsive or attractive power is.

This NBody implementation uses an approximation of forces based on the [Barnes and Hutts approximation algorithm](https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation).

The following additional arguments can be passed to the constructor:
 - **theta** 
   - **Description**: *Parameter used to control performance vs accuracy. Should be around 1 +/- 0,3*
   - **Type**: `number`
   - **Default**: `1.1`
 - **distanceMax** 
   - **Description**: *The maximum distance between nodes to consider approximations*
   - **Type**: `number`
   - **Default**: `Infinity`
 - **distanceMin** 
   - **Description**: *The minimum distance between nodes to consider approxiamations*
   - **Type**: `number`
   - **Default**: `1`
 - **isRepulse** 
   - **Description**: *If true nodes push each other away, if false nodes attract each other*
   - **Type**: `boolean`
   - **Default**: `true`

---

### Force
***Type: Incremental***

The force component can generate incremental force-directed layouts using the Fruchterman & Reingold algorithm. For larger graphs that need to be rendered continuously you may want to consider combining nbody, link and axis components, which will generally provide better performance in terms of computational speed.

The following additional arguments can be passed to the constructor:
 - **size** 
   - **Description**: *Parameter used to control the size of the graph. Generally a fairly high number.*
   - **Type**: `number`
   - **Default**: `nodes.length * 20000`
 - **gravity** 
   - **Description**: *Strength of the gravity in the layout.*
   - **Type**: `number`
   - **Default**: `1`
 - **speed** 
   - **Description**: *The speed at which things move in the graph.*
   - **Type**: `number`
   - **Default**: `0.1`

---

### Link
***Type: Incremental***

The link component is used to attract nodes in the graph that have edges connecting them. The component's strength changes depending on the distance between the two nodes relative to the `.distance` property configured on the edge, `.distance` being the optimal distance between the two nodes.

The following additional arguments can be passed to the constructor:
 - **useRelativeStrength** 
   - **Description**: *Should edge strength be computed based on total edge counts for connected nodes rather than a fixed value?*
   - **Type**: `boolean`
   - **Default**: `false`

---

### Collision
***Type: Incremental***

The collision component stops nodes from colliding (i.e. overlapping) with each other. This component is based on the assumption that all nodes are round, and will use the `.radius` property on nodes to compute if they are colliding or not.

Note that if no radius is provided to Trassel then a default one will be initiated, or derived from width and height values.

The following additional arguments can be passed to the constructor:
 - **theta** 
   - **Description**: *The strength of the collision repulsion*
   - **Type**: `number`
   - **Default**: `1`
 - **strength** 
   - **Description**: *Padding that will be added to all radiuses*
   - **Type**: `number`
   - **Default**: `5`

---

### Attraction (Gravity)
***Type: Incremental***

An attraction component can be used to create attraction to a given point in the graph. The component can be configured to either be vertical or horizontal. It is typically used to either create a gravitational force towards the center of a graph, or to draw nodes into a straight line.

This component could also be used to push nodes away from a given point by setting the strength to a negative value.

The following additional arguments can be passed to the constructor:
 - **isHorizontal** 
   - **Description**: *true = x, false = yn*
   - **Type**: `boolean`
   - **Default**: `true`
 - **coordinate** 
   - **Description**: *the center coordinate of the component*
   - **Type**: `boolean`
   - **Default**: `0`
 - **strength** 
   - **Description**: *The strength of the pull*
   - **Type**: `number`
   - **Default**: `0.05`

---

### Hierarchy
***Type: Static***

Hierarchy can be used to compute a hierarchical layout of nodes based on their edges, minimizing edge crossings and optimizing node positions for easier viewing. The levels of the hierarchy can either by computed by the layout itself (based on the edges in the graph) or according to a provided groupBy function reference that will be executed for each node, and return a group id. The component is based on the Sugiyama Framework.

The following additional arguments can be passed to the constructor:
 - **computeGroup** 
   - **Description**: *A function that will take the bound data from the node. If left blank groups will be computed.*
   - **Type**: `node => "string`
   - **Default**: `null`
 - **useY** 
   - **Description**: *If true the hierachy will be top to bottom, otherwise it will be left to right*
   - **Type**: `boolean`
   - **Default**: `true`
 - **distance** 
   - **Description**: *How much space should be between nodes. If not set this will be determined by the size of the nodes*
   - **Type**: `number`
   - **Default**: `undefined`
 - **useLine** 
   - **Description**: *If set nodes will be set into a fixed order, trying to minimize edge crossings.*
   - **Type**: `boolean`
   - **Default**: `true`
 - **centerX** 
   - **Description**: *Center X coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`
 - **centerY** 
   - **Description**: *Center Y coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`

---

### Tree
***Type: Static***

Tree is similar to hierarchy, but excels att processing layouts in hierarchies with single-parent relationships. Generally speaking tree will execute faster than hierarchy, but for complex data the result will be worse.

The layout is based on the Reingold-Tilford algorithm, but has been slightly modified to allow for things like multiple root nodes, centering in a coordinate system, and varying node sizes

The following additional arguments can be passed to the constructor:
 - **isVerticalLayout** 
   - **Description**: *If true the tree will be top to bottom, otherwise it will be left to right*
   - **Type**: `boolean`
   - **Default**: `true`
 - **padding** 
   - **Description**: *Padding between nodes*
   - **Type**: `number`
   - **Default**: `100`
 - **centerX** 
   - **Description**: *Center X coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`
 - **centerY** 
   - **Description**: *Center Y coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`

---

### Connections
***Type: Static***

Connections is a great way of computing layouts for connection graphs. The layout shows hierarchies as rectangular shapes. Visually it looks like lists that connect to each other.

The following additional arguments can be passed to the constructor:
 - **groupBy** 
   - **Description**: *If provided the nodes will be assigned to hierarchy levels according to the function. Note that the returned values must be in order from 0 to max level.*
   - **Type**: `node => number`
   - **Default**: `null`
 - **isVerticalLayout** 
   - **Description**: *If true the tree will be top to bottom, otherwise it will be left to right*
   - **Type**: `boolean`
   - **Default**: `true`
 - **padding** 
   - **Description**: *Padding between nodes*
   - **Type**: `number`
   - **Default**: `100`
 - **centerX** 
   - **Description**: *Center X coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`
 - **centerY** 
   - **Description**: *Center Y coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`

---

### Grid
***Type: Incremental***

Grid layout creates a grid on either the Y-axis, X-axis or both. The grid draws nodes towards these sets of axises, creating a matrix of small gravitational spaces resulting in a more square looking graph. This layout can help make some graphs look much more tidy. 

If using this strength together with a link component it is generally recommended to lower the strength of the link component.

The following additional arguments can be passed to the constructor:
 - **useY** 
   - **Description**: *If true the Y axis force will be activated*
   - **Type**: `boolean`
   - **Default**: `true`
 - **useX** 
   - **Description**: *If true the X axis force will be activated*
   - **Type**: `boolean`
   - **Default**: `true`
 - **strength** 
   - **Description**: *How strong should the pull be?*
   - **Type**: `number`
   - **Default**: `0.6`
 - **size** 
   - **Description**: *How large should each axis space be?*
   - **Type**: `number`
   - **Default**: `undefined`
 - **offsetMultiplier** 
   - **Description**: *If no size is provided the size of nodes will be used. This multiplier can be used to multiply the measurements by a given number.*
   - **Type**: `number`
   - **Default**: `3`

---

### Matrix
***Type: Static***

Matrix places all nodes into a square matrix. This is usefull for example if you want to get an overview of all nodes that are currently displayed. The nodes will be ordered left to right, top to bottom based on barycentric ordering (i.e. nodes sharing many connections are grouped closer together). 

The following additional arguments can be passed to the constructor:
 - **strength** 
   - **Description**: *How strong should the pull into the matrix be? (0-1)*
   - **Type**: `number`
   - **Default**: `0.9`
 - **centerX** 
   - **Description**: *Center X coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`
 - **centerY** 
   - **Description**: *Center Y coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`

---

### Cluster
***Type: Incremental***

Cluster layout allows you to cluster nodes together into groups. This is useful if for example you want to show relationships between nodes that are not necessarily connected by edges.

The following additional arguments can be passed to the constructor:
 - **strength** 
   - **Description**: *How strong should the force be? (0-1)*
   - **Type**: `number`
   - **Default**: `0.7`

---

### Radial
***Type: Incremental***

Radial layout draws nodes into a circular pattern centered on a given set of coordinates and optionally with a given diameter. This is particularly useful if nodes are heavily interconnected, and it it is difficult to make out what is actually connected to what. You can also use this component to create radial clusters (i.e. layers of circles).

The following additional arguments can be passed to the constructor:
 - **strength** 
   - **Description**: *How strong should the force be? (0-1)*
   - **Type**: `number`
   - **Default**: `0.9`
 - **centerX** 
   - **Description**: *Center X coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`
 - **centerY** 
   - **Description**: *Center Y coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`
 - **diameter** 
   - **Description**: *Diameter of the circle*
   - **Type**: `number`
   - **Default**: `null`
 - **sizeMultiplier** 
   - **Description**: *If diameter is automatically computed based on nodes, how much extra space should be added? (Multiplier)*
   - **Type**: `number`
   - **Default**: `1.2`

---

### Fan
***Type: Static***

Fan layout orders nodes into lines pointing out from a center point. This is a useful layout for visualising circular hierarchies.

 - **computeGroup** 
   - **Description**: *A function that will take the node as an argument and return a group ID.*
   - **Type**: `node => "string"`
   - **Default**: `undefined`
 - **strength** 
   - **Description**: *How strong should the force be? (0-1)*
   - **Type**: `number`
   - **Default**: `null`
 - **space** 
   - **Description**: *How many pixels from the center should the first node be drawn?*
   - **Type**: `number`
   - **Default**: `null`
 - **centerX** 
   - **Description**: *Center X coordinate of the component*
   - **Type**: `number`
   - **Default**: `null`
 - **centerY** 
   - **Description**: *Center Y coordinate of the component*
   - **Type**: `number`
   - **Default**: `1.2`

---

### Center
***Type: Incremental***

Center component tries to ensure that the average of all node coordinates should be 0. This means that the graph will be centered without affecting the nodes' relative position to each other. The center component is particularly useful in graphs that are not disjointed.

 - **x** 
   - **Description**: *Coordinate for the component*
   - **Type**: `number"`
   - **Default**: `0`
 - **y** 
   - **Description**: *Coordinate for the component*
   - **Type**: `number`
   - **Default**: `0`
 - **strength** 
   - **Description**: *Strength of the force*
   - **Type**: `number`
   - **Default**: `1`

---

### Bounding Box
***Type: Static***

Bounding box creates an invisible rectangular box that stops nodes from traveling outside.

If no width or height is provided to the bounding box function these values will be computed based on the amount of nodes and their `.radius` attributes.

 - **width** 
   - **Description**: *Width of the box. If not set will be determined by the sizes and amounts of the nodes*
   - **Type**: `number"`
   - **Default**: `null`
 - **height** 
   - **Description**: *Height of the box. If not set will be determined by the sizes and amounts of the nodes*
   - **Type**: `number`
   - **Default**: `null`

---

### D3 Adapter
***Type: N/A***

The D3 adapter can be used to implement d3 forces in Trassel layouts. Note that several parameters in Trassels computations are differently scaled from d3, and as a result you may need to fiddle with the default values of your forces.

 - **d3force** 
   - **Description**: *The instantiated d3 force*
   - **Type**: `N/A`
   - **Default**: `undefined`

---

### Animation
***Type: Incremental***

Animation components can be used to transport nodes from one position to another. These components can also be configured to remove themselves from the layout once all nodes have reached their destinations.

The component takes a global set of coordinates that all nodes will be animated towards, but will also check for .targetX and .targetY properties on each node the component is applied to.

 - **xDestination** 
   - **Description**: *Destination X coordinate*
   - **Type**: `number`
   - **Default**: `0`
 - **yDestination** 
   - **Description**: *Destination Y coordinate*
   - **Type**: `number`
   - **Default**: `0`
 - **strength** 
   - **Description**: *The strength of the pull*
   - **Type**: `number`
   - **Default**: `1`
 - **removeLayoutComponentOnDestination** 
   - **Description**: *If true the component will be removed from the layout when all nodes have arrived.*
   - **Type**: `boolean`
   - **Default**: `true`

---

### Custom components

You can develop your own components by creating a class that implements the ILayoutComponent interface.

This can be done like so:
```javascript
import { LayoutComponents } from "trassel"

class MyComponent extends LayoutComponents.Component {
    /**
     * This function will be executed every time nodes and edges in the layout are updated, as well as when the component is first added.
     * If there are node bindings or edge bindings then only those nodes and edges are provided to the function. Otherwise all nodes and edges.
     */
    initialize(...args) {
        super.initialize(...args)
    }
    /**
     * The update function is executed on each update in the layout engine, and will receive the current alpha value as an argument.
     * During the update the nodes and edges provided on initialization can be updated.
     */
    execute(alpha) {
        this.nodes // -> Access to nodes
        this.edges // -> Access to edges
        this.utils // -> Utilities
    }

    /**
     * When the component is removed from the layout this function will be invoked.
     * Any cleanup should be done here.
     */ 
    dismount() {}
}
```

---

## Animate entire state

Sometimes you may want to animate the entire layout from one state into another. You can instruct Trassel to carry out one big animation to a set of new fixed coordinates, triggering update events along the way.

In order to execute a state animation you provide an array of target state objects as well as an optional duration and boolean value for if the new state should be fixated (.fx and .fy properties) or not (.x and .y properties).

Once triggered the animation cannot be stopped, and no other updates can be triggered for the duration of it.

Beware that no more than one animation should be triggered at a time, as this would cause multiple loops to execute simultaneously.

The following is what a target state object looks like:

```javascript
declare type NodeID = string | number
export interface ITargetNodeState {
	id: NodeID,
	sourceX: number,
	sourceY: number,
	targetX: number,
	targetY: number
}
```
