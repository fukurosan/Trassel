import { initializeNodesAndEdges } from "./util/initializer"
import Loop from "./loop"
import Quadtree from "./util/quadtree"

/**
 * Main layout class
 */
export default class Layout {
	/**
	 * @param {import("./model/ibasicnode").IBasicNode[]=} nodes - Initial nodes
	 * @param {import("./model/ibasicedge").IBasicEdge[]=} edges - Initial edges
	 * @param {import("./model/ioptions").ILayoutOptions} options - options
	 */
	constructor(nodes = [], edges = [], options = {}) {
		this.nodes = nodes
		this.edges = edges
		this.alpha = options.alpha || 1
		this.alphaMin = options.alphaMin || 0.001
		this.alphaDecay = options.alphaDecay || 1 - Math.pow(this.alphaMin, 1 / 300)
		this.alphaTarget = options.alphaTarget || 0
		this.velocityDecay = options.velocityDecay || 0.6
		/** @type {Map<string, import("./model/ilayoutcomponentobject").ILayoutComponentObject>} */
		this.components = new Map()
		this.listeners = new Map([
			["layoutloopstart", new Set()],
			["layoutupdate", new Set()],
			["layoutloopend", new Set()]
		])
		this.loop = new Loop(this.runLoop.bind(this), options.updateCap ? options.updateCap : 60)
		this.initializeNodesAndEdges()
		this.quadtree = new Quadtree(this.nodes)
		this.isAnimating = false
	}

	/**
	 * Registers an event listener
	 * @param {string} name - Event name to listen for
	 * @param {() => any} fn - Callback on event
	 */
	on(name, fn) {
		if (!this.listeners.has(name)) {
			console.error(`No such event name: ${name}`)
		}
		this.listeners.get(name).add(fn)
	}

	triggerEvent(name) {
		this.listeners.get(name).forEach(fn => fn())
	}

	/**
	 * This is the main loop function.
	 * Each time the loop instance triggers an update this will execute.
	 */
	runLoop() {
		this.update()
		if (this.alpha < this.alphaMin) {
			this.loop.stop()
			this.triggerEvent("layoutloopend")
		}
	}

	updateNodesAndEdges(nodes, edges) {
		this.nodes = nodes
		this.edges = edges
		this.initializeNodesAndEdges()
		this.components.forEach(component => this.initializeComponent(component))
	}

	initializeNodesAndEdges() {
		initializeNodesAndEdges(this.nodes, this.edges)
		this.quadtree = new Quadtree(this.nodes)
	}

	initializeComponent(component) {
		let nodes = this.nodes
		let edges = this.edges
		if (component.nodeBindings) {
			nodes = this.nodes.filter(node => component.nodeBindings(node))
		}
		if (component.edgeBindings) {
			edges = this.edges.filter(edge => component.edgeBindings(edge))
		}
		component.instance.initialize(nodes, edges, { quadtree: this.quadtree, remove: () => this.removeComponent(component.id) })
		return component
	}

	/**
	 * Starts the layout loop
	 */
	start() {
		this.triggerEvent("layoutloopstart")
		this.loop.start()
	}

	/**
	 * Stops the layout loop
	 */
	stop() {
		this.loop.stop()
		this.triggerEvent("layoutloopend")
	}

	/**
	 * Sets the update cap (per second) for the layout loop
	 * @param {number} newCap - new cap
	 */
	setUpdateCap(newCap) {
		this.loop.setUpdateCap(newCap)
	}

	/**
	 * Adds a component to the layout
	 * @param {string} id
	 * @param {import("./model/ilayoutcomponent").ILayoutComponent} component - A layout component compatible class instance
	 * @param {(any) => boolean=} nodeBindings - Function that computes if a node should be affected by the component. Blank means true for all.
	 * @param {(any) => boolean=} edgeBindings - Function that computes if an edge should be affected by the component. Blank means true for all.
	 * @returns {Layout} - this
	 */
	addLayoutComponent(id, component, nodeBindings = null, edgeBindings = null) {
		if (this.components.has(id)) {
			throw new Error("Component already exists: " + id)
		}
		const componentObject = {
			id,
			instance: component,
			nodeBindings,
			edgeBindings
		}
		this.initializeComponent(componentObject)
		this.components.set(id, componentObject)
		return this
	}

	/**
	 * Removes a compnent with the specified ID
	 * @param {string} id
	 */
	removeComponent(id) {
		if (this.components.has(id)) {
			this.components.get(id).instance.dismount()
			this.components.delete(id)
		}
	}

	/**
	 * Finds the node closest to the provided coordinates
	 * @param {number} x
	 * @param {number} y
	 * @returns {any} - The node
	 */
	findClosestNodeByCoordinates(x, y) {
		let closest
		let radius = Infinity
		for (let i = 0; i < this.nodes.length; ++i) {
			const node = this.nodes[i]
			const distanceX = x - node.x
			const distanceY = y - node.y
			const distanceSquared = distanceX * distanceX + distanceY * distanceY
			if (distanceSquared < radius) {
				closest = node
				radius = distanceSquared
			}
		}
		return closest
	}

	/**
	 * Animates nodes from source positions to target positions within a duration provided.
	 * This function can be used to transition the graph between states or layouts.
	 * Once triggered the animation cannot be stopped. All other updates and components will be frozen until the animation completes.
	 * There should *never* be more than one animation running simultaneously.
	 * @param {import("./model/itargetnodestate").ITargetNodeState[]} targetNodeStates
	 * @param {number} duration - Animation duration in milliseconds
	 * @param {boolean} shouldFixateOnEnd - If true then the graph will fixate the nodes when the animation ends
	 */
	animateState(targetNodeStates = [], duration = 300, shouldFixateOnEnd = false) {
		if (!targetNodeStates.length) return
		this.nodeMap = this.nodes.reduce((acc, node) => {
			acc[node.id] = node
			return acc
		}, {})
		targetNodeStates.forEach(state => {
			state.sourceX = isNaN(state.sourceX) ? this.nodeMap[state.id].x : state.sourceX
			state.sourceY = isNaN(state.sourceY) ? this.nodeMap[state.id].y : state.sourceY
		})
		const startTime = Date.now()
		const loop = new Loop(() => {
			const deltaTime = Date.now() - startTime
			const percentOfAnimation = Math.min(deltaTime / duration, 100)
			targetNodeStates.forEach(nodeState => {
				const node = this.nodeMap[nodeState.id]
				node.x = nodeState.sourceX + (nodeState.targetX - nodeState.sourceX) * percentOfAnimation
				node.y = nodeState.sourceY + (nodeState.targetY - nodeState.sourceY) * percentOfAnimation
			})
			if (deltaTime > duration) {
				loop.stop()
				this.isAnimating = false
				if (shouldFixateOnEnd) {
					targetNodeStates.forEach(nodeState => {
						const node = this.nodeMap[nodeState.id]
						node.fx = node.x
						node.fy = node.y
					})
				}
			}
			this.triggerEvent("layoutupdate")
		}, Infinity)
		this.isAnimating = true
		loop.start()
	}

	/**
	 * Main update function.
	 * This executes all components in the layout and computes node positions.
	 * Note that the update function can be executed without the looper.
	 * @param {boolean} sendEvent - Should an update event be fired?
	 */
	update(sendEvent = true) {
		if (this.isAnimating) {
			return
		}
		this.alpha += (this.alphaTarget - this.alpha) * this.alphaDecay
		for (const [, component] of this.components.entries()) {
			component.instance.execute(this.alpha)
		}
		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i]
			if (node.fx == null) {
				node.vx *= this.velocityDecay
				node.x += node.vx
			} else {
				node.x = node.fx
				node.vx = 0
			}
			if (node.fy == null) {
				node.vy *= this.velocityDecay
				node.y += node.vy
			} else {
				node.y = node.fy
				node.vy = 0
			}
		}
		this.iteration = this.iteration ? this.iteration + 1 : 1
		this.quadtree.update()
		sendEvent && this.triggerEvent("layoutupdate")
	}
}
