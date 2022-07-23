# Shortest path

Shortest path means finding a path between two nodes in the graph that requires either the least amount edge traversals, or where the weight of edges traversedis minimized. Trassel allows you to easily compute shortest paths within your data.

## Weighted path

For computing weighted paths Trassel uses Dijkstra's algorithm under the hood. This is a way of finding the shortest path between two nodes in a graph, attempting to minimize the total weight of edges along the way.

Check out this example:

```javascript
import { Trassel } from "trassel"

const nodes = [{id: "n1"},{id: "n2"},{id: "n3"},{id: "n4"},{id: "n5"}]
const edges = [
    {sourceNode: "n1", targetNode: "n2", weight: 1},
    {sourceNode: "n2", targetNode: "n3", weight: 1},
    {sourceNode: "n3", targetNode: "n4", weight: 1},
    {sourceNode: "n4", targetNode: "n5", weight: 1},
    {sourceNode: "n3", targetNode: "n5", weight: 1000},
]
const graph = new Trassel(nodes, edges)
const path = graph.findShortestPathWeighted("n1", "n5", true, true, false)
path // -> ["n1", "n2", "n3", "n4" "n5"]
```

--- 

## Unweighted path

An unweighted path search means that weights of edges are not taken into account. Instead the shortest path will simply be considered the path that requires the least amount of edges to be traversed.

Check out this example:

```javascript
import { Trassel } from "trassel"

const nodes = [{id: "n1"},{id: "n2"},{id: "n3"},{id: "n4"},{id: "n5"}]
const edges = [
    {sourceNode: "n1", targetNode: "n2"},
    {sourceNode: "n2", targetNode: "n3"},
    {sourceNode: "n3", targetNode: "n4"},
    {sourceNode: "n4", targetNode: "n5"},
    {sourceNode: "n3", targetNode: "n5"},
]
const graph = new Trassel(nodes, edges)
const path = graph.findShortestPathUnweighted("n1", "n5", true, true)
path // -> ["n1", "n2", "n3", "n5"]
```
