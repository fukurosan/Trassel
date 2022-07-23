# Data Manager

Trassel comes with a built in data manager that allows you to query your dataset and control what nodes are online or offline in computations and layouts. Most functions in Trassel also support both directed and undirected data structures.

## Directed vs undirected

Some graphs are directed while others are undirected. What this means is that some edges go *from* A *to* B, while some simply *connect* A and B. In other words, if a graph is directed then that means edges can only be traversed in one direction. This is important because in different algorithms edges may be handled differently depending on if they are directed or not. For example, if determining the shortest path between two nodes. 

## Online and offline nodes

By default all nodes are brought online when a dataset is provided to Trassel. You can bring nodes online and offline using a number of different functions, as well as retrieve the current state of the graph. When a node is brought offline it is no longer exposed to the layout engine or other functions in Trassel. This means that if you have a large set of data you can feed everything into Trassel, but only choose to bring a specific set of nodes online at any given time. Trassel can even do things like execute loops that bring adjacent nodes offline recursively given certain parameters. 

The data manager can access and compute information about the relationships between online nodes and offline nodes, which is typically helpful when building interactive applications. For example, *how many offline nodes are connected to online node "N1"*?

When a node is brought offline all edges that connect to it are also brought offline, all of this is handled internally in Trassel. 

Check out this showcase:
```javascript
import { Trassel } from "trassel

const nodes = [{ id: "n1" }, { id: "n2" }]
const edges = [{ sourceNode: "n1", targetNode: "n2" }]
const graph = new Trassel(nodes, edges)

//Retrieving online and offline nodes/edges in Trassel:
graph.getOnlineNodes() // ->  [{ id: "n1" }, { id: "n2" }]
graph.getOfflineNodes() // -> []
graph.getOnlineEdges() // -> [{ sourceNode: "n1", targetNode: "n2" }]
graph.getOfflineEdges() // -> []
//Checking if an edge or a node is online
graph.isEdgeOnline(edges[0]) // -> true
graph.isNodeOnline("n1") // -> true
//Bringing all nodes online or offline
graph.bringAllNodesOffline()
graph.bringAllNodesOnline()
//Bringing an array of nodes online or offline (referenced by ID)
graph.bringNodesOffline(["n1"]) // -> void
//When n1 is brought offline so are all edges that connect with it
//If we try to retrieve neighbors for n2 we will get an empty array
graph.getNeighbors("n2", false, true, true) // -> []
//We can instruct Trassel to ignore the online/offline state like so:
graph.getNeighbors("n2", false, false, true) // -> [{ sourceNode: "n1", targetNode: "n2" }]
//Finally, we can bring n1 back online
graph.bringNodesOnline(["n1"]) // -> void
```

## Implode & Explode

When bringing nodes offline or online it is sometimes not as simple as saying that a single node should be affected. Trassel allows you to compute different types of implosions and explosions. These functions can recursively (or non-recursively) find affected nodes based on a starting point in the graph and return an array of node IDs. 

Imagine for example that "A -> B -> C -> D" where node A is online and the rest offline. In this scenario we may want to "explode" node A recursively and bring B online, then traverse its neighbors, then their neighbors, and so on. This is easy with trassel. There are three types of operations that can be utilized, "single", "recursive" or "leafs" with a number of different options. The functions will not apply the state, but simply return the affected nodes' IDs in an array, you can then make a decision for if you want to apply the new state or not by simply forwarding the nodes to the appropriate "bringNodesOnline" or "bringNodesOffline" functions.

The function used for this is computeImplodeOrExplodeNode. It takes the following arguments:

| Argument       | Description                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| rootNodeID     | ID of the root node to start traversal from                                                                   |
| isBringOnline  | If true we are looking for offline nodes, otherwise online nodes                                              |
| isDirected     | If true edges are considered undirected, otherwise directed (i.e. what direction can the edges be traversed)  |
| mode           | "single", "leaf" or "recursive"                                                                               |
| alpha target   | Alpha target for the layout. This determines what alpha value the layout engine wants to reach (and stay at). |
| velocity decay | Velocity decay determines how quickly velocity decreases. I.e. the friction of nodes in the graph.            |


#### Single

This type of operation explodes / implodes all neighbors of the input node non-recursively.

```javascript
import { Trassel } from "trassel

const nodes = [{ id: "n1" }, { id: "n2" }, { id: "n3" }]
const edges = [{ sourceNode: "n1", targetNode: "n2" },{ sourceNode: "n2", targetNode: "n3" }]
const graph = new Trassel(nodes, edges)

graph.computeImplodeOrExplodeNode("n1", false, false, mode = "single") // -> ["n2"]
```

#### Leafs

This type of operation explodes / implodes all neighbors that are leaf nodes non-recursively.

```javascript
import { Trassel } from "trassel

const nodes = [{ id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }]
const edges = [{ sourceNode: "n1", targetNode: "n2" },{ sourceNode: "n2", targetNode: "n3" }, { sourceNode: "n1", targetNode: "n4" }]
const graph = new Trassel(nodes, edges)

graph.computeImplodeOrExplodeNode("n1", false, false, mode = "single") // -> ["n4"]
```

#### Recursive

This type of operation explodes / implodes all node neighbors recursively

```javascript
import { Trassel } from "trassel

const nodes = [{ id: "n1" }, { id: "n2" }, { id: "n3" }]
const edges = [{ sourceNode: "n1", targetNode: "n2" },{ sourceNode: "n2", targetNode: "n3" }]
const graph = new Trassel(nodes, edges)

graph.computeImplodeOrExplodeNode("n1", false, false, mode = "single") // -> ["n2", "n3"]
```

---

## computeTargetCoordinates

Compute target coordinates is a utility function specifically made to help determine where nodes that are being brought online best fit in current layout, based on where other connected nodes are currently located.

The function takes a list of node IDs that are currently offline, and determines their optimal position. If the node is connected to more than one other node in the graph then the optimal position will be the average of all the neighbors' coordinates, and for nodes that only have one neighbor (or no neighbor) they will be positioned a provided distance from a provided set of coordinates, positioning all such nodes in a circle around this point in the graph in order to minimize overlap.

The function returns a set of coordinates per node, which can then be used by a visualization to, for example, animate the nodes into position, or simply directly apply the new coordinates.

--- 
