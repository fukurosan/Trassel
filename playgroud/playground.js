import "./playground.css"
import * as Trassel from "../src/index"
import data from "./graph.json"

window.Trassel = Trassel

// Import graph
// const nodes = data.nodes
// const edges = data.edges

//Heavy graph
// const nodes = []
// const edges = []
// for (let i = 0; i < 2000; i++) {
// 	nodes.push({
// 		id: "n" + i,
// 		radius: 50,
// 		mass: 1000
// 	})
// }
// for (let i = 0; i < 5000; i++) {
// 	edges.push({
// 		sourceNode: "n" + Math.round(Math.abs(i / 5)),
// 		targetNode: "n" + Math.round(Math.abs(i / 5 - 1)),
// 		visibleDistance: 100,
// 		renderer: {
// 			color: "#00594E",
// 			label: "Hello World!!!!"
// 		}
// 	})
// }

//Heavy graph 2
const nodes = []
const edges = []
for (let i = 0; i < 1000; i++) {
	nodes.push({
		id: "n" + i,
		radius: 50,
		mass: 1000
	})
	edges.push({
		sourceNode: "n" + Math.floor(Math.sqrt(i)),
		targetNode: "n" + i,
		visibleDistance: 100,
		renderer: {
			color: "#00594E",
			label: "Hello World!!!!"
		}
	})
}

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
}, 2000)

const FPSCounter = document.createElement("div")
FPSCounter.setAttribute(
	"style",
	"position:fixed;left:24px;top:24px;font-size:1rem;font-weight:bold;color:black;padding:16px;background-color:white;border-radius:8px;font-family:sans-serif;border:1px solid lightgray;"
)
FPSCounter.innerHTML = "0 FPS"
document.body.appendChild(FPSCounter)
let lastDate = Date.now()
let now = null
let frames = 0
setInterval(() => {
	frames++
	if ((now = Date.now()) - lastDate > 1000) {
		FPSCounter.innerHTML = `${frames} FPS`
		frames = 0
		lastDate = now
	}
}, 0)
