import "./playground.css"
import * as Trassel from "../src/index"
import data from "./foaf.json"
window.Trassel = Trassel

// Import graph
let nodes = data.nodes
let edges = data.edges
let templates = data.templates ? data.templates : undefined

//Heavy graph
// nodes = []
// edges = []
// templates = {}
// for (let i = 0; i < 2000; i++) {
// 	nodes.push({
// 		id: "n" + i,
// 		mass: 1000
// 	})
// }
// for (let i = 0; i < 5000; i++) {
// 	edges.push({
// 		sourceNode: "n" + Math.round(Math.abs(i / 5)),
// 		targetNode: "n" + Math.round(Math.abs(i / 5 - 1)),
// 		visibleDistance: 100,
// 		rendererOptions: {
// 			label: "Hello World!!!!",
// 			labelTextColor: "#00594E"
// 		}
// 	})
// }

//Heavy graph 2
// nodes = []
// edges = []
// templates = {}
// for (let i = 0; i < 1000; i++) {
// 	nodes.push({
// 		id: "n" + i,
// 		shape: {
// 			id: "circle",
// 			radius: 50
// 		}
// 	})
// 	edges.push({
// 		sourceNode: "n" + Math.floor(Math.sqrt(i)),
// 		targetNode: "n" + i,
// 		visibleDistance: 100,
// 		rendererOptions: {
// 			color: "#00594E",
// 			label: "Hello World!!!!"
// 		}
// 	})
// }

const graph = new Trassel.Trassel(nodes, edges, { templates, layout: { updateCap: Infinity } })
const renderer = new Trassel.Renderer(document.querySelector(".graph"), graph.getNodes(), graph.getEdges())
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
	renderer.toggleSelectNodes([event.node])
})
renderer.on("backdropclick", () => {
	renderer.clearAllNodeSelections()
})
renderer.on("lassoupdate", event => {
	renderer.toggleSelectNodes([...event.added, ...event.removed])
})
graph.addLayoutComponent("nbody", new Trassel.LayoutComponents.NBody())
graph.addLayoutComponent("collide", new Trassel.LayoutComponents.Collision())
graph.addLayoutComponent("x", new Trassel.LayoutComponents.Attraction({ isHorizontal: true }))
graph.addLayoutComponent("y", new Trassel.LayoutComponents.Attraction({ isHorizontal: false }))
graph.addLayoutComponent("link", new Trassel.LayoutComponents.Link())
graph.on("layoutupdate", () => {
	renderer.render()
})
renderer.setTransform(0, 0, 0.3)
graph.startLayoutLoop()
document.querySelector(".graph").addEventListener("contextmenu", event => event.preventDefault())

setTimeout(() => {
	renderer.zoomToFit()
}, 1000)

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
