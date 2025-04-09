import "./playground.css"
import * as Trassel from "../src/index"
import patents from "./circle.json"
import foaf from "./foaf.json"
import smallgraph from "./graph.json"
import lesmiserables from "./lemiserables.json"
window.Trassel = Trassel

//Initialize graph
let nodes = []
let edges = []
let templates = undefined
const graph = new Trassel.Trassel(nodes, edges, { templates, layout: { updateCap: Infinity } })

//Create context menu
const contextMenuBuilder = entity => {
	// if(entity.shape) //Node
	// if(entity.sourceNode && entity.targetNode) //Edge
	// if(entity === null) //Canvas
	return [
		{
			label: "Option A",
			icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
			action: () => {}
		},
		"divider",
		{
			label: "Option B",
			icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
			action: [
				{
					label: "Option A",
					icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
					action: () => {}
				},
				{
					label: "Option B",
					icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
					action: [
						{
							label: "Option A",
							icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
							action: () => {}
						},
						{
							label: "Option B",
							icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
							action: () => {}
						}
					]
				}
			]
		},
		{
			label: "Option C",
			icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
			action: () => {}
		}
	]
}

//Initialize renderer
const renderer = new Trassel.Renderer(document.querySelector(".graph"), graph.getNodes(), graph.getEdges(), {
	zoomControls: true,
	contextMenuBuilder
})
await renderer.initialize()

//Register key listeners and effects
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

//Register renderer events
renderer.on("entitydragstart", event => {
	event.node.fx = event.node.x
	event.node.fy = event.node.y
})
renderer.on("entitydragmove", event => {
	graph.setLayoutAlphaTarget(0.1)
	graph.setLayoutAlpha(0.1)
	graph.startLayoutLoop()
	event.node.fx = event.position.x
	event.node.fy = event.position.y
})
renderer.on("entitydragend", event => {
	delete event.node.fx
	delete event.node.fy
	graph.setLayoutAlphaTarget(0)
})
renderer.on("entityclick", event => {
	if (!shiftKey) renderer.clearAllSelections()
	renderer.toggleSelectNodes([event.node])
})
renderer.on("edgelabelclick", event => {
	if (!shiftKey) renderer.clearAllSelections()
	renderer.toggleSelectEdges([event.edge])
})
renderer.on("backdropclick", () => {
	renderer.clearAllSelections()
})
renderer.on("lassoupdate", event => {
	renderer.toggleSelectNodes([...event.addedNodes, ...event.removedNodes])
	renderer.toggleSelectEdges([...event.addedEdges, ...event.removedEdges])
})

//Configure default layout
graph.addLayoutComponent("nbody", new Trassel.LayoutComponents.NBody())
graph.addLayoutComponent("collide", new Trassel.LayoutComponents.Collision())
graph.addLayoutComponent("x", new Trassel.LayoutComponents.Attraction({ isHorizontal: true }))
graph.addLayoutComponent("y", new Trassel.LayoutComponents.Attraction({ isHorizontal: false }))
graph.addLayoutComponent("link", new Trassel.LayoutComponents.Link())

//Register graph events
graph.on("layoutupdate", () => {
	renderer.render()
})

//Start layout loop
graph.startLayoutLoop()

//Zoom to fit after 1 second
setTimeout(() => {
	renderer.zoomToFit()
}, 1000)

//Stop context menus on the canvas
document.querySelector(".graph").addEventListener("contextmenu", event => event.preventDefault())

//Create FPS counter
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

//Define data collections and set initial data
window.updateGraphData = async name => {
	graph.getNodes().forEach(node => ((node.fx = null), (node.fy = null)))
	if (name === "patents") {
		nodes = patents.nodes
		edges = patents.edges
		templates = patents.templates
	} else if (name === "foaf") {
		nodes = foaf.nodes
		edges = foaf.edges
		templates = foaf.templates
	} else if (name === "smallgraph") {
		nodes = smallgraph.nodes
		edges = smallgraph.edges
		templates = smallgraph.templates
	} else if (name === "lesmiserables") {
		nodes = lesmiserables.nodes
		edges = lesmiserables.edges
		templates = lesmiserables.templates
	} else if (name === "snake") {
		nodes = []
		edges = []
		templates = {}
		for (let i = 0; i < 2000; i++) {
			nodes.push({
				id: "n" + i,
				mass: 1000
			})
		}
		for (let i = 0; i < 5000; i++) {
			edges.push({
				sourceNode: "n" + Math.round(Math.abs(i / 5)),
				targetNode: "n" + Math.round(Math.abs(i / 5 - 1)),
				visibleDistance: 100,
				rendererOptions: {
					label: "Hello World!!!!",
					labelTextColor: "#00594E"
				}
			})
		}
	} else if (name === "clusters") {
		nodes = []
		edges = []
		templates = {}
		for (let i = 0; i < 1000; i++) {
			nodes.push({
				id: "n" + i,
				shape: {
					id: "circle",
					radius: 50
				}
			})
			edges.push({
				sourceNode: "n" + Math.floor(Math.sqrt(i)),
				targetNode: "n" + i,
				visibleDistance: 100,
				rendererOptions: {
					color: "#00594E",
					label: "Hello World!!!!"
				}
			})
		}
	} else if (name === "lattice") {
		const n = 20
		nodes = []
		edges = []
		for (let i = 0; i < n * n; i++) {
			nodes.push({ id: `n${i}`, shape: { id: "circle", radius: 20 }, mass: 500 })
		}
		for (let y = 0; y < n; y++) {
			for (let x = 0; x < n; x++) {
				if (y > 0) edges.push({ sourceNode: `n${(y - 1) * n + x}`, targetNode: `n${y * n + x}`, visibleDistance: 1, strength: 2 })
				if (x > 0) edges.push({ sourceNode: `n${y * n + (x - 1)}`, targetNode: `n${y * n + x}`, visibleDistance: 1, strength: 2 })
			}
		}
	}
	graph.stopLayoutLoop()
	graph.updateNodesAndEdges(nodes, edges, templates)
	await renderer.updateNodesAndEdges(nodes, edges)
	graph.setLayoutAlpha(1)
	graph.startLayoutLoop()
}
//Set the initial data
window.updateGraphData("foaf")

//Functions for the UI
//Execute a graph search
window.searchGraph = criteria => {
	renderer.clearAllDisabledStatuses()
	renderer.disableNodes(node => !node.id.includes(criteria))
}
//Clear the search
window.clearSearch = () => {
	renderer.clearAllDisabledStatuses()
}

//Execute a node zoom
window.zoomToNode = id => {
	renderer.zoomToNode(id)
}

//Execute zoom to fit
window.zoomToFitGraph = () => {
	renderer.zoomToFit()
}

//Update layout
window.updateLayoutGraph = name => {
	graph.stopLayoutLoop()
	graph.getNodes().forEach(node => ((node.fx = null), (node.fy = null)))
	graph.clearAllLayoutComponents()
	if (name === "force") {
		graph.addLayoutComponent("nbody", new Trassel.LayoutComponents.NBody())
		graph.addLayoutComponent("collide", new Trassel.LayoutComponents.Collision())
		graph.addLayoutComponent("x", new Trassel.LayoutComponents.Attraction({ isHorizontal: true }))
		graph.addLayoutComponent("y", new Trassel.LayoutComponents.Attraction({ isHorizontal: false }))
		graph.addLayoutComponent("link", new Trassel.LayoutComponents.Link())
	} else if (name === "force2") {
		graph.addLayoutComponent("force", new Trassel.LayoutComponents.Force())
	} else if (name === "hierarchy") {
		graph.addLayoutComponent("hierarchy", new Trassel.LayoutComponents.Hierarchy())
	} else if (name === "connection") {
		graph.addLayoutComponent("connections", new Trassel.LayoutComponents.Connections())
	} else if (name === "tree") {
		graph.addLayoutComponent("tree", new Trassel.LayoutComponents.Tree())
	} else if (name === "cluster") {
		graph.addLayoutComponent("nbody", new Trassel.LayoutComponents.NBody())
		graph.addLayoutComponent("collide", new Trassel.LayoutComponents.Collision())
		graph.addLayoutComponent("x", new Trassel.LayoutComponents.Attraction({ isHorizontal: true }))
		graph.addLayoutComponent("y", new Trassel.LayoutComponents.Attraction({ isHorizontal: false }))
		graph.addLayoutComponent("link", new Trassel.LayoutComponents.Link())
		graph.addLayoutComponent("cluster", new Trassel.LayoutComponents.Cluster())
	} else if (name === "fan") {
		graph.addLayoutComponent("fan", new Trassel.LayoutComponents.Fan())
	} else if (name === "grid") {
		graph.addLayoutComponent("nbody", new Trassel.LayoutComponents.NBody())
		graph.addLayoutComponent("collide", new Trassel.LayoutComponents.Collision())
		graph.addLayoutComponent("x", new Trassel.LayoutComponents.Attraction({ isHorizontal: true }))
		graph.addLayoutComponent("y", new Trassel.LayoutComponents.Attraction({ isHorizontal: false }))
		graph.addLayoutComponent("link", new Trassel.LayoutComponents.Link())
		graph.addLayoutComponent("grid", new Trassel.LayoutComponents.Grid())
	} else if (name === "matrix") {
		graph.addLayoutComponent("matrix", new Trassel.LayoutComponents.Matrix())
	} else if (name === "radial") {
		graph.addLayoutComponent("nbody", new Trassel.LayoutComponents.NBody())
		graph.addLayoutComponent("collide", new Trassel.LayoutComponents.Collision())
		graph.addLayoutComponent("x", new Trassel.LayoutComponents.Attraction({ isHorizontal: true }))
		graph.addLayoutComponent("y", new Trassel.LayoutComponents.Attraction({ isHorizontal: false }))
		graph.addLayoutComponent("radial", new Trassel.LayoutComponents.Radial())
	}
	graph.setLayoutAlpha(1)
	graph.startLayoutLoop()
}

//Update line type
window.updateLineTypeGraph = name => {
	renderer.setLineType(name)
}

//Toggle bounding force
window.toggleBoundingForce = () => {
	graph.stopLayoutLoop()
	if (graph.hasLayoutComponent("bounding")) {
		graph.removeLayoutComponent("bounding")
	} else {
		graph.addLayoutComponent("bounding", new Trassel.LayoutComponents.BoundingBox({ width: 1500, height: 1500 }))
	}
	graph.setLayoutAlpha(1)
	graph.startLayoutLoop()
}

//Toggle center force
window.toggleCenterForce = () => {
	graph.stopLayoutLoop()
	if (graph.hasLayoutComponent("Center")) {
		graph.removeLayoutComponent("Center")
	} else {
		graph.addLayoutComponent("Center", new Trassel.LayoutComponents.Center())
	}
	graph.setLayoutAlpha(1)
	graph.startLayoutLoop()
}

//Download as image
window.exportToPng = () => {
	renderer.exportToPng()
}
