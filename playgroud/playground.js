import "./playground.css"
import * as Trassel from "../src/index"
import data from "./graph.json"

window.Trassel = Trassel

const nodes = data.nodes
const edges = data.edges
const graph = new Trassel.Trassel(nodes, edges, { layout: { updateCap: Infinity } })
const renderer = new Trassel.Renderer(document.querySelector(".graph"), nodes, edges)
await renderer.initialize()
let shiftKey = false
let ctrlKey = false
let altKey = false
const keyListener = event => {
	shiftKey = !!event.shiftKey
	ctrlKey = !!event.ctrlKey
	altKey = !!event.altKey
	if (altKey) {
		renderer.toggleLasso(true)
	} else {
		renderer.toggleLasso(false)
	}
}
window.addEventListener("keydown", keyListener)
window.addEventListener("keyup", keyListener)
renderer.on("entitydragstart", event => {
	event.node.fx = event.node.x
	event.node.fy = event.node.y
	graph.setLayoutAlphaTarget(0.1)
	graph.setLayoutAlpha(0.1)
	graph.startLayoutLoop()
})
renderer.on("entitydragmove", event => {
	event.node.fx = event.position.x
	event.node.fy = event.position.y
})
renderer.on("entitydragend", event => {
	delete event.node.fx
	delete event.node.fy
	graph.setLayoutAlphaTarget(0)
})
renderer.on("entityclick", event => {
	if (!shiftKey) renderer.clearAllNodeSelections()
	renderer.toggleSelectNode(event.node)
})
renderer.on("backdropclick", () => {
	renderer.clearAllNodeSelections()
})
renderer.on("lassoupdate", event => {
	;[...event.added, ...event.removed].forEach(node => renderer.toggleSelectNode(node))
})
graph.addLayoutComponent("collide", new Trassel.LayoutComponents.Collision())
graph.addLayoutComponent("nbody", new Trassel.LayoutComponents.NBody())
graph.addLayoutComponent("x", new Trassel.LayoutComponents.Attraction(true))
graph.addLayoutComponent("y", new Trassel.LayoutComponents.Attraction(false))
graph.addLayoutComponent("link", new Trassel.LayoutComponents.Link())
graph.on("layoutupdate", () => {
	renderer.render()
})
graph.startLayoutLoop()
document.querySelector(".graph").addEventListener("contextmenu", event => event.preventDefault())
setTimeout(() => {
	renderer.zoomToFit()
}, 200)