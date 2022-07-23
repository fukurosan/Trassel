# Traversal

Trassel enables easy traversal of its provided dataset, allowing other systems and modules to focus on the business logic.

Traversing the dataset can be done through either a depth-first search (DFS) or a breadth-first search (BFS). The traversal functions take a root node as input and then traverses the graph from that points according to its provided arguments.

The traversal functions take a callback as an argument that will receive each node as an argument during traversal. If the function returns true the traversal for the current branch will end.

## BFS

BFS is a bredth-first search. This means that the graph data is traversed one level at a time.

Example: (N1 -> N1, N2 -> N1, N3 -> N3, N4). The order would be N1, N2, N3, N4.

Here's how to do it:
```javascript
import { Trassel } from "trassel"

const nodes = [{id: "n1"},{id: "n2"},{id: "n3"},{id: "n4"},{id: "n5"},{id: "n6"}]
const edges = [
    {sourceNode: "n1", targetNode: "n2"},
    {sourceNode: "n1", targetNode: "n3"},
    {sourceNode: "n2", targetNode: "n4"},
    {sourceNode: "n2", targetNode: "n5"},
    {sourceNode: "n5", targetNode: "n6"},
]
const graph = new Trassel(nodes, edges)
const IDs = []
graph.BFS("n1", node => {
    IDs.push(node.id)
    if (node.id === "n5") {
        return true
    }
}, true, true)
IDs // -> ["n1", "n2", "n3", "n4", "n5"]
```

--- 

## DFS

DFS is a depth-first search. This means that the graph data is traversed one branch at a time.

Example: (N1 -> N1, N2 -> N1, N3 -> N2, N4). The order would be N1, N2, N3, N4.

Here's how to do it:

```javascript
import { Trassel } from "trassel"

const nodes = [{id: "n1"},{id: "n2"},{id: "n3"},{id: "n4"},{id: "n5"},{id: "n6"}]
const edges = [
    {sourceNode: "n1", targetNode: "n2"},
    {sourceNode: "n1", targetNode: "n3"},
    {sourceNode: "n2", targetNode: "n4"},
    {sourceNode: "n2", targetNode: "n5"},
    {sourceNode: "n5", targetNode: "n6"},
]
const graph = new Trassel(nodes, edges)
const IDs = []
graph.DFS("n1", node => {
    IDs.push(node.id)
    if (node.id === "n5") {
        return true
    }
}, true, true)
IDs // -> ["n1", "n2", "n4", "n5", "n6", "n3"]
```
