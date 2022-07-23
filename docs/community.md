# Community Detection

A community is a subset of nodes within a larger collection that are densely connected to each other, but loosely connected others.

Trassel supports a number of different ways of finding communities within its dataset.

## Louvain

The Louvain method is an unsupervised algorithm used to detect communities in graphs. It works by maximizing modularity scores for each community and uses this information to determine optimal assignments for nodes. In other words, it evaluates the denseness of connections within a community and compares that to other potential node assignments. Trassel's implementation is iterative, and computes what is essentially a dendogram of node groups until no further optimization of modularity is possible, or gains are marginal.

Check out this example of how to execute louvain:
```javascript
import { Trassel } from "trassel"

const nodes = [{id: "n1"},{id: "n2"},{id: "n3"}]
const edges = [
    {sourceNode: "n1", targetNode: "n2"},
    {sourceNode: "n2", targetNode: "n1"},
]
const graph = new Trassel(nodes, edges)
const communities = graph.louvain()
communities /* ->
{
    communities: [["n1","n2"], ["n3"]]
    communityTable: {n1: 0, n2: 0, n3: 1}
}
*/
```

--- 

## Strongly connected components

Strongly connected components are subsets of a directed graphs where each node is reachable from every other node. Trassel is able to compute stongly connected components using [Kosaraju's algorithm]("https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm")

Check out this example:

```javascript
import { Trassel } from "trassel"

const nodes = [{id: "n1"},{id: "n2"},{id: "n3"}]
const edges = [
    {sourceNode: "n1", targetNode: "n2"},
    {sourceNode: "n2", targetNode: "n1"},
]
const graph = new Trassel(nodes, edges)
const components = graph.computeStronglyConnectedComponents(true)
components // -> [["n1","n2"], ["n3"]]
```
