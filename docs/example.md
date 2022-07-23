# Basic Examples

A collection of some basic examples

## Typical force directed layout

This is how to create a typical force directed layout.

```javascript
import { Trassel, LayoutComponents } from "trassel"

const nodes = [{id: "n1"}, {id: "n2"}]
const edges = [{sourceNode: "n1", targetNode: "n2"}]

const graph = new Trassel(nodes, edges)
graph.addLayoutComponent("collide", new LayoutComponents.Collision())
graph.addLayoutComponent("manybody", new LayoutComponents.NBody())
graph.addLayoutComponent("x", new LayoutComponents.Attraction(true))
graph.addLayoutComponent("y", new LayoutComponents.Attraction(false))
graph.addLayoutComponent("link", new LayoutComponents.Link())
graph.on("layoutupdate", () => {
	console.log("Layout was updated!")
})
graph.on("layoutloopend", () => {
	console.log("Layout loop ended!")
})
graph.startLayoutLoop()
```

## Static hierarchical layout

This is how to compute a simple, static hierarchical layout.

```javascript
import { Trassel, LayoutComponents } from "trassel"

const nodes = [{id: "n1"}, {id: "n2"}, {id: "n3"}]
const edges = [{sourceNode: "n1", targetNode: "n2"}, {sourceNode: "n1", targetNode: "n3"}]

const graph = new Trassel(nodes, edges)
graph.addLayoutComponent("hierarchy", new LayoutComponents.Hierarchy())
graph.updateLayout()
```

## Simple force directed rendering

This is how to create a simple force directed rendering using Trassels own renderer.

<a href="https://fukurosan.github.io/Trassel/examples/examplerenderer.html">Example</a>

## External rendering

This is how to create a super simple and interactive WebGL renderer using Trassel's layout engine and PixiJS.

<a href="https://fukurosan.github.io/Trassel/examples/pixiexample.html">Example</a>

## Rendering a hierarchy

This is how to render a simple hierarchical layout

<a href="https://fukurosan.github.io/Trassel/examples/examplehierarchy.html">Example</a>

## Computing a layout change and animating it

This is how to compute a new state for the entire graph and then animating it.

<a href="https://fukurosan.github.io/Trassel/examples/exampleanimatestate.html">Example</a>
