import * as PIXI from "pixi.js"
import { OrthogonalConnector } from "./orthogonalRouter"
import { Env } from "../config/env"

/**
 * The WebGL renderer class is a bit messy right now, and some functionality should be broken out into separate files.
 * There are also several performance optimizations that could be made.
 * This started out as a "basic" renderer, but grew into a playground for fun and interesting ideas.
 */
export class WebGLRenderer {
	/**
	 * @param {HTMLElement} element
	 * @param {import("../model/nodesandedges").RendererNode[]} nodes
	 * @param {import("../model/nodesandedges").RendererEdge[]} edges
	 * @param {import("../model/rendereroptions").IRendererOptions[]} options
	 */
	constructor(element, nodes, edges, options) {
		/** @type {HTMLElement} */
		this.element = element
		this.element.style.overflow = "hidden"
		/** @type {import("../model/nodesandedges").InternalRendererNode[]} */
		this.nodes = nodes
		/** @type {import("../model/nodesandedges").InternalRendererEdge[]} */
		this.edges = edges
		/** @type {import("../model/rendereroptions").IRendererOptions[]} */
		this.options = options
		/** @type {PIXI.Renderer} */
		this.renderer = null
		/** @type {PIXI.Container} */
		this.stage = null
		/** @type {PIXI.Container} */
		this.backdrop = null
		/** @type {ResizeObserver | null} */
		this.resizeObserver = null
		this.lassoEnabled = false
		/** @type {import("../model/rendereroptions").LineTypes} */
		this.lineType = this.options?.lineType || "line"
		this.rotateEdgeLabels = typeof this.options?.rotateEdgeLabels === "boolean" ? this.options?.rotateEdgeLabels : Env.DEFAULT_RENDERER_ROTATE_EDGE_LABELS
		this.LINE_MARGIN_PX = Env.RENDERER_LINE_MARGIN
		this.sceneSize = Env.RENDERER_SCENE_SIZE
		this.primaryColor = options?.primaryColor ? this.getHexColor(this.options.primaryColor) : Env.DEFAULT_RENDERER_PRIMARY_COLOR
		this.backgroundColor = this.options?.backdropColor ? this.getHexColor(this.options.backdropColor) : Env.DEFAULT_RENDERER_BACKGROUND_COLOR
		this.listeners = new Map([
			["backdropclick", new Set()],
			["backdroprightclick", new Set()],
			["entityclick", new Set()],
			["entityrightclick", new Set()],
			["entityhoverstart", new Set()],
			["entityhovermove", new Set()],
			["entityhoverend", new Set()],
			["entitydragstart", new Set()],
			["entitydragmove", new Set()],
			["entitydragend", new Set()],
			["edgelabelhoverstart", new Set()],
			["edgelabelhovermove", new Set()],
			["edgelabelhoverend", new Set()],
			["edgelabelclick", new Set()],
			["edgelabelrightclick", new Set()],
			["canvasdragstart", new Set()],
			["canvasdragend", new Set()],
			["lassostart", new Set()],
			["lassoupdate", new Set()],
			["lassoend", new Set()]
		])
		//Markers are the tips of the edges, the arrow heads
		this.markers = {
			none: "data:image/svg+xml;utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'></svg>",
			arrow: "data:image/svg+xml;utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' style='fill:%23000000;'><polygon points='0,0 30,15 0,30' /></svg>",
			hollowArrow:
				"data:image/svg+xml;utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' style='fill:%23ffffff;stroke:%23000000;stroke-width:4;'><polygon points='0,0 30,15 0,30' /></svg>"
		}
	}

	/**
	 * Takes a hex color as input either as a number or string, returns the value as a number
	 * @param {string | number} value - The value
	 */
	getHexColor(value) {
		if (typeof value == "string") {
			return PIXI.Color.shared.setValue(value).toNumber()
		}
		return value
	}

	/**
	 * Registers an event listener
	 * @template {& keyof import("../model/rendereroptions").RendererEvents} T
	 * @param {T} name
	 * @param {import("../model/rendereroptions").RendererEventCallaback<T>} fn
	 */
	on(name, fn) {
		if (!this.listeners.has(name)) {
			console.error(`No such event name: ${name}`)
		}
		this.listeners.get(name).add(fn)
	}

	/**
	 * Triggers an event to all listeners
	 * @template {& keyof import("../model/rendereroptions").RendererEvents} T
	 * @param {T} name
	 * @param {import("../model/rendereroptions").RendererEvents[T]} payload
	 */
	triggerEvent(name, payload) {
		this.listeners.get(name).forEach(fn => fn(payload))
	}

	async initialize() {
		await this.initializeRenderer()
		this.initializePanAndBackdropEvents()
		this.initializeZoom()
		this.initializeResizer()
		await this.initializeData(this.nodes, this.edges)
		this.initializeEdgeCounters()
		this.initializeLasso()
	}

	/**
	 * Initializes the main renderer classes and variables
	 */
	async initializeRenderer() {
		this.worldWidth = this.sceneSize
		this.worldHeight = this.sceneSize
		const width = this.element.clientWidth
		const height = this.element.clientHeight
		this.stage = new PIXI.Container()
		this.stage.position.set(width / 2, height / 2)
		this.renderer = await PIXI.autoDetectRenderer({
			preference: "webgl",
			resolution: Env.RENDERER_RESOLUTION,
			width,
			height,
			autoDensity: true,
			antialias: true,
			backgroundAlpha: 1,
			backgroundColor: this.backgroundColor
		})
		this.renderer.view.canvas.style.display = "block"
		this.element.appendChild(this.renderer.view.canvas)
		this.backdrop = new PIXI.Container()
		this.backdrop.interactive = true
		this.backdrop.containsPoint = () => true
		const svg = `data:image/svg+xml;utf-8,<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='200' height='200' style='background-color:%23${this.backgroundColor.toString(
			16
		)};'><path style='stroke: %23a0a0a0; stroke-width: 4px;fill: none;stroke-dasharray: 0;stroke-linecap: round; stroke-linejoin: round;' d='M95 100 L105 100 M100 95 L100 105 Z' /></svg>`
		const texture = await PIXI.Assets.load(svg)
		const tilingSprite = new PIXI.TilingSprite({ texture, width: this.worldWidth, height: this.worldHeight, tileScale: { x: 0.25, y: 0.25 } })
		tilingSprite.anchor.set(0.5)
		this.backdrop.addChild(tilingSprite)
		this.stage.addChild(this.backdrop)
	}

	/**
	 * Makes the canvas panable (dragable) and interactive
	 */
	initializePanAndBackdropEvents() {
		let initialMouseX
		let initialMouseY
		let mouseDrag = false
		let blockCanvasClick = false
		const onStageDragStart = event => {
			if (!this.lassoEnabled) {
				initialMouseX = event.data.global.x - this.stage.x
				initialMouseY = event.data.global.y - this.stage.y
				mouseDrag = true
				this.backdrop.on("globalpointermove", onStageDragMove)
				this.triggerEvent("canvasdragstart")
			}
		}
		const onStageDragMove = event => {
			if (mouseDrag) {
				blockCanvasClick = true
				this.stage.x = event.data.global.x - initialMouseX
				this.stage.y = event.data.global.y - initialMouseY
				PIXI.Culler.shared.cull(this.stage, this.renderer.screen)
				requestAnimationFrame(() => this.renderer.render(this.stage))
			}
		}
		const onStageDragEnd = () => {
			if (mouseDrag) {
				mouseDrag = false
				this.backdrop.removeEventListener("globalpointermove", onStageDragMove)
				this.triggerEvent("canvasdragend")
				setTimeout(() => {
					blockCanvasClick = false
				}, 1)
			}
		}
		const onClick = event => {
			if (!blockCanvasClick && !this.lassoEnabled) {
				this.triggerEvent("backdropclick", { position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
			}
		}
		const onRightClick = event => {
			if (!blockCanvasClick && !this.lassoEnabled) {
				this.triggerEvent("backdroprightclick", { position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
			}
		}
		this.backdrop
			.on("pointerdown", onStageDragStart)
			.on("pointerup", onStageDragEnd)
			.on("pointerupoutside", onStageDragEnd)
			.on("click", onClick)
			.on("rightclick", onRightClick)
	}

	/**
	 * makes the canvas zoomable
	 */
	initializeZoom() {
		const maxScale = Env.RENDERER_MAX_SCALE
		const minScale = Env.RENDERER_MIN_SCALE
		let isZooming = false
		const handleZoom = event => {
			event.stopPropagation()
			event.preventDefault()
			const mouseX = event.clientX
			const mouseY = event.clientY
			const localPointBefore = this.stage.toLocal(new PIXI.Point(mouseX, mouseY))
			const alpha = 1 + Math.abs(event.wheelDelta) / Env.RENDERER_ZOOM_SENSITIVITY
			let shouldRender = false
			let scale = this.stage.scale._x
			if (event.wheelDelta < 0) {
				scale = Math.min(scale * alpha, maxScale)
				this.stage.updateTransform({ x: this.stage.x, y: this.stage.y, scaleX: scale, scaleY: scale })
				shouldRender = true
			} else if (event.wheelDelta) {
				scale = Math.max(scale / alpha, minScale)
				this.stage.updateTransform({ x: this.stage.x, y: this.stage.y, scaleX: scale, scaleY: scale })
				shouldRender = true
			}
			const localPointAfter = this.stage.toLocal(new PIXI.Point(mouseX, mouseY))
			if (localPointAfter.x !== localPointBefore.x || localPointAfter.y !== localPointBefore.y) {
				this.stage.x += (localPointAfter.x - localPointBefore.x) * this.stage.scale.x
				this.stage.y += (localPointAfter.y - localPointBefore.y) * this.stage.scale.y
			}
			if (shouldRender) {
				//This prevents us from spamming zoom events that lock the event loop
				isZooming = true
				setTimeout(() => {
					if (isZooming) {
						isZooming = false
						this.render()
					}
				}, 0)
			}
		}
		this.renderer.view.canvas.addEventListener("wheel", handleZoom)
	}

	/**
	 * Makes the canvas auto resize when the parent element size changes
	 */
	initializeResizer() {
		let throttle = null
		this.resizeObserver = new ResizeObserver(() => {
			if (throttle) {
				clearTimeout(throttle)
			}
			throttle = setTimeout(() => {
				this.renderer.resize(this.element.clientWidth, this.element.clientHeight)
				requestAnimationFrame(() => this.renderer.render(this.stage))
			}, 100)
		})
		this.resizeObserver.observe(this.element)
	}

	/**
	 * Initializes all the graphics for provided nodes and edges
	 * @param {import("../model/nodesandedges").RendererNode[]} nodes
	 * @param {import("../model/nodesandedges").RendererEdge[]} edges
	 */
	async initializeData(nodes, edges) {
		const FOCUS_SHAPE_SIZE_HALF = 6
		this.nodes = nodes
		this.edges = edges
		const nodeLookupMap = new Map()
		const nodesContainer = new PIXI.Container()
		const edgesContainer = new PIXI.Container()
		const edgeLabelContainer = new PIXI.Container()
		//Initializes Nodes
		for (const node of this.nodes) {
			nodeLookupMap.set(node.id, node)
			node.rendererInternals = {
				container: new PIXI.Container(),
				node: new PIXI.Graphics(),
				text: null,
				icon: null,
				selected: new PIXI.Graphics(),
				isFocused: false,
				isSelected: false,
				isDisabled: false
			}
			//Draw shape
			const nodeGfx = node.rendererInternals.node
			node.rendererInternals.container.addChild(nodeGfx)
			const nodeShape = node.shape.id
			const nodeHeight = node.shape.height || node.shape.radius * 2
			const nodeWidth = node.shape.width || node.shape.radius * 2
			if (nodeShape === "rectangle") {
				nodeGfx.roundRect(-(nodeWidth / 2), -(nodeHeight / 2), nodeWidth, nodeHeight, 4)
			} else {
				nodeGfx.circle(0, 0, node.shape.radius)
			}
			nodeGfx.fill(this.getHexColor(node.rendererOptions?.backgroundColor || Env.DEFAULT_RENDERER_NODE_FILL))
			nodeGfx.stroke({ width: Env.DEFAULT_RENDERER_NODE_STROKE_WIDTH, color: Env.DEFAULT_RENDERER_NODE_STROKE })
			//Draw label
			const fontSize = Math.max(nodeHeight * 0.1, Env.RENDERER_NODE_MIN_FONT_SIZE)
			const icon = node.rendererOptions?.icon
			const iconMaxSize = Env.RENDERER_NODE_MAX_ICON_SIZE
			const iconMinSize = Env.RENDERER_NODE_MIN_ICON_SIZE
			const iconSize = Math.max(Math.min(nodeHeight * 0.2, iconMaxSize), iconMinSize)
			const wordWrapWidth = nodeShape === "rectangle" ? (icon ? nodeWidth - iconSize * 3 : nodeWidth * 0.625) : node.shape.radius * 1.25
			const textStyle = new PIXI.TextStyle({
				fontFamily: Env.RENDERER_NODE_FONT_FAMILY,
				fontSize,
				wordWrap: true,
				breakWords: true,
				wordWrapWidth,
				align: "center",
				fill: this.getHexColor(node.rendererOptions?.textColor || Env.DEFAULT_RENDERER_NODE_TEXT_COLOR)
			})
			const label = node.rendererOptions?.label || `${node.id}`
			const measurements = PIXI.CanvasTextMetrics.measureText(label, textStyle)
			let processedLabel = measurements.lines.shift()
			const shouldWrapText = (nodeShape === "rectangle" && nodeHeight >= 40) || (nodeShape !== "rectangle" && node.shape.radius > 40)
			if (measurements.lines.length && shouldWrapText) {
				processedLabel = `${processedLabel}\n${measurements.lines.shift()}`
			}
			if (measurements.lines.length) {
				processedLabel = `${processedLabel.slice(0, processedLabel.length - 2)}..`
			}
			const text = new PIXI.Text({ text: processedLabel, style: textStyle })
			text.resolution = Env.RENDERER_NODE_TEXT_RESOLUTION
			text.anchor.set(0.5)
			node.rendererInternals.container.addChild(text)
			node.rendererInternals.text = text
			//Draw icon
			if (node.rendererOptions?.icon) {
				const texture = await PIXI.Assets.load(node.rendererOptions?.icon)
				const icon = PIXI.Sprite.from(texture)
				icon.width = iconSize
				icon.height = iconSize
				icon.anchor.x = 0.5
				icon.anchor.y = 0.5
				text.anchor.y = 0.5
				text.anchor.x = 0.5
				node.rendererInternals.container.addChild(icon)
				if (nodeShape === "rectangle") {
					icon.x = -measurements.maxLineWidth / 2 - icon.width / 2
					text.x = iconSize / 2
				} else {
					icon.anchor.y = 1.2
					text.anchor.y = 0
				}
				node.rendererInternals.icon = icon
			}
			//Add selection graphics
			const selectedGfx = node.rendererInternals.selected
			if (node.shape.id === "rectangle") {
				selectedGfx.roundRect(
					-(node.shape.width / 2 + FOCUS_SHAPE_SIZE_HALF),
					-(node.shape.height / 2 + FOCUS_SHAPE_SIZE_HALF),
					node.shape.width + FOCUS_SHAPE_SIZE_HALF * 2,
					node.shape.height + FOCUS_SHAPE_SIZE_HALF * 2,
					8
				)
			} else {
				selectedGfx.circle(0, 0, node.shape.radius + FOCUS_SHAPE_SIZE_HALF)
			}
			selectedGfx.fill(this.primaryColor)
			selectedGfx.alpha = 0
			node.rendererInternals.container.addChildAt(selectedGfx, 0)
			//Make node dragable
			nodeGfx.interactive = true
			nodeGfx.cursor = "pointer" //Added in pixi v7 to replace nodegfx.buttonMode = true
			let dragEventData = null
			let dragging = false
			let blockClick = false
			let initialMouse = null
			let initialNode = { x: null, y: null }
			const onDragStart = event => {
				dragEventData = event.data
				initialMouse = dragEventData.getLocalPosition(this.stage)
				dragging = true
				nodeGfx.on("globalpointermove", onDragMove)
				initialNode = { x: node.x, y: node.y }
				this.triggerEvent("entitydragstart", { node, position: { ...initialNode } })
			}
			const onDragMove = () => {
				if (dragging) {
					blockClick = true
					const newPosition = dragEventData.getLocalPosition(this.stage)
					const delta = { x: newPosition.x - initialMouse.x, y: newPosition.y - initialMouse.y }
					this.triggerEvent("entitydragmove", { node, position: { x: initialNode.x + delta.x, y: initialNode.y + delta.y }, delta: { ...delta } })
				}
			}
			const onDragEnd = () => {
				setTimeout(() => {
					blockClick = false
				}, 1)
				dragging = false
				nodeGfx.removeEventListener("globalpointermove", onDragMove)
				dragEventData = null
				this.triggerEvent("entitydragend", { node })
			}
			nodeGfx.on("pointerdown", onDragStart)
			nodeGfx.on("pointerup", onDragEnd)
			nodeGfx.on("pointerupoutside", onDragEnd)
			//Give node hover effect
			const focusGfx = new PIXI.Graphics()
			const focusGfx2 = new PIXI.Graphics()
			focusGfx.alpha = 0.2
			focusGfx2.alpha = 0.1
			if (node.shape.id === "rectangle") {
				focusGfx.roundRect(
					-(node.shape.width / 2 + FOCUS_SHAPE_SIZE_HALF),
					-(node.shape.height / 2 + FOCUS_SHAPE_SIZE_HALF),
					node.shape.width + FOCUS_SHAPE_SIZE_HALF * 2,
					node.shape.height + FOCUS_SHAPE_SIZE_HALF * 2,
					8
				)
				focusGfx2.roundRect(
					-(node.shape.width / 2 + FOCUS_SHAPE_SIZE_HALF * 2),
					-(node.shape.height / 2 + FOCUS_SHAPE_SIZE_HALF * 2),
					node.shape.width + FOCUS_SHAPE_SIZE_HALF * 4,
					node.shape.height + FOCUS_SHAPE_SIZE_HALF * 4,
					12
				)
			} else {
				focusGfx.circle(0, 0, node.shape.radius + FOCUS_SHAPE_SIZE_HALF)
				focusGfx2.circle(0, 0, node.shape.radius + FOCUS_SHAPE_SIZE_HALF * 2)
			}
			focusGfx.fill(this.primaryColor)
			focusGfx2.fill(this.primaryColor)
			const pointerOver = event => {
				if (!dragging) {
					node.rendererInternals.container.addChildAt(focusGfx, 0)
					node.rendererInternals.container.addChildAt(focusGfx2, 0)
					node.rendererInternals.isFocused = true
					this.render()
					this.triggerEvent("entityhoverstart", { node, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
				}
			}
			const pointerMove = event => {
				this.triggerEvent("entityhovermove", { node, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
			}
			const pointerOut = () => {
				if (node.rendererInternals.isFocused) {
					node.rendererInternals.container.removeChild(focusGfx)
					node.rendererInternals.container.removeChild(focusGfx2)
					node.rendererInternals.isFocused = false
					this.render()
					this.triggerEvent("entityhoverend", { node })
				}
			}
			nodeGfx.on("pointerover", pointerOver)
			nodeGfx.on("pointermove", pointerMove)
			nodeGfx.on("pointerout", pointerOut)
			//Make node clickable
			const onClick = event => {
				if (!blockClick) {
					this.triggerEvent("entityclick", { node, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
				}
			}
			const onRightClick = event => {
				if (!blockClick) {
					this.triggerEvent("entityrightclick", { node, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
				}
			}
			nodeGfx.on("click", onClick)
			nodeGfx.on("rightclick", onRightClick)
			//Add node to stage
			node.rendererInternals.container.cullable = true
			node.rendererInternals.container.cullableChildren = false
			nodesContainer.addChild(node.rendererInternals.container)
		}
		//Initialize Edges
		for (const edge of this.edges) {
			//Initialize edge properties
			const markerSourceAsset = await PIXI.Assets.load(
				edge.rendererOptions?.markerSource ? this.markers[edge.rendererOptions?.markerSource] : this.markers.none
			)
			const markerTargetAsset = await PIXI.Assets.load(
				edge.rendererOptions?.markerTarget ? this.markers[edge.rendererOptions?.markerTarget] : this.markers.arrow
			)
			const markerSource = PIXI.Sprite.from(markerSourceAsset)
			const markerTarget = PIXI.Sprite.from(markerTargetAsset)
			const markerSize = Env.RENDERER_EDGE_MARKER_SIZE
			markerSource.width = markerSize
			markerSource.height = markerSize
			markerTarget.width = markerSize
			markerTarget.height = markerSize
			edge.rendererInternals = {
				source: nodeLookupMap.get(edge.sourceNode),
				target: nodeLookupMap.get(edge.targetNode),
				container: new PIXI.Container(),
				line: new PIXI.Graphics(),
				markerSource,
				markerTarget,
				text: null,
				isSelected: false,
				isFocused: false,
				isDisabled: false,
				selected: null,
				edgeCounter: {
					//Placeholder, this is computed in a different function
					total: -1,
					index: -1
				}
			}
			edge.rendererInternals.container.addChild(edge.rendererInternals.line)
			edge.rendererInternals.container.addChild(edge.rendererInternals.markerSource)
			edge.rendererInternals.container.addChild(edge.rendererInternals.markerTarget)
			edge.rendererInternals.markerSource.anchor.set(0.45, 0.25)
			edge.rendererInternals.markerTarget.anchor.set(0.45, 0.25)
			edge.rendererInternals.container.cullable = true
			edge.rendererInternals.container.cullableChildren = false
			edgesContainer.addChild(edge.rendererInternals.container)
			//Initialize label
			if (edge.rendererOptions?.label) {
				const textStyle = new PIXI.TextStyle({
					fontFamily: Env.RENDERER_EDGE_FONT_FAMILY,
					fontSize: Env.RENDERER_EDGE_FONT_SIZE,
					wordWrap: true,
					breakWords: true,
					align: "center",
					wordWrapWidth: (edge.rendererOptions.isInteractive ? Env.RENDERER_EDGE_LABEL_WIDTH : false) || edge.visibleDistance * 0.5,
					fill: this.getHexColor(edge.rendererOptions?.labelTextColor || Env.DEFAULT_RENDERER_EDGE_TEXT_COLOR)
				})
				const label = edge.rendererOptions?.label
				const measurements = PIXI.CanvasTextMetrics.measureText(label, textStyle)
				let processedLabel = measurements.lines[0]
				if (measurements.lines.length > 1) {
					processedLabel = `${processedLabel.slice(0, processedLabel.length - 2)}..`
				}
				const text = new PIXI.Text({ text: processedLabel, style: textStyle })
				text.resolution = Env.RENDERER_EDGE_TEXT_RESOLUTION
				if (edge.sourceNode !== edge.targetNode) {
					text.anchor.x = 0.5
					text.anchor.y = 1.2
				} else {
					text.anchor.x = 0.5
					text.anchor.y = 0.5
				}
				const textContainer = new PIXI.Container()
				textContainer.addChild(text)
				//If the edge is interactive, then update the label
				if (edge.rendererOptions?.isInteractive) {
					text.anchor.y = 0.5
					const width = (Env.RENDERER_EDGE_LABEL_WIDTH || text.width) + Env.RENDERER_EDGE_LABEL_INLINE_PADDING
					const height = text.height + Env.RENDERER_EDGE_LABEL_BLOCK_PADDING
					const textBackground = new PIXI.Graphics()
					textBackground.alpha = 1
					textBackground.roundRect(-width / 2, -height / 2, width, height, 4)
					textBackground.fill(this.getHexColor(edge.rendererOptions?.labelBackgroundColor || Env.DEFAULT_RENDERER_EDGE_LABEL_FILL))
					textBackground.stroke({
						width: Env.DEFAULT_RENDERER_EDGE_LABEL_STROKE_WIDTH,
						color: this.getHexColor(edge.rendererOptions?.labelBackgroundColor || Env.DEFAULT_RENDERER_EDGE_LABEL_STROKE)
					})
					textContainer.addChildAt(textBackground, 0)
					//Make it selectable
					const selectedGfx = new PIXI.Graphics()
					edge.rendererInternals.selected = selectedGfx
					selectedGfx.roundRect(
						-(width / 2 + FOCUS_SHAPE_SIZE_HALF),
						-(height / 2 + FOCUS_SHAPE_SIZE_HALF),
						width + FOCUS_SHAPE_SIZE_HALF * 2,
						height + FOCUS_SHAPE_SIZE_HALF * 2,
						8
					)
					selectedGfx.fill(this.primaryColor)
					selectedGfx.alpha = 0
					textContainer.addChildAt(selectedGfx, 0)
					//Make it focusable
					const textFocusBackground = new PIXI.Graphics()
					const textFocusBackground2 = new PIXI.Graphics()
					textFocusBackground.roundRect(
						-width / 2 - FOCUS_SHAPE_SIZE_HALF * 2,
						-height / 2 - FOCUS_SHAPE_SIZE_HALF * 2,
						width + FOCUS_SHAPE_SIZE_HALF * 4,
						height + FOCUS_SHAPE_SIZE_HALF * 4,
						12
					)
					textFocusBackground2.roundRect(
						-width / 2 - FOCUS_SHAPE_SIZE_HALF,
						-height / 2 - FOCUS_SHAPE_SIZE_HALF,
						width + FOCUS_SHAPE_SIZE_HALF * 2,
						height + FOCUS_SHAPE_SIZE_HALF * 2,
						8
					)
					textFocusBackground.fill(this.primaryColor)
					textFocusBackground2.fill(this.primaryColor)
					textFocusBackground.alpha = 0.1
					textFocusBackground2.alpha = 0.2
					textContainer.interactive = true
					const pointerOver = event => {
						textContainer.addChildAt(textFocusBackground, 0)
						textContainer.addChildAt(textFocusBackground2, 0)
						edge.rendererInternals.isFocused = true
						this.render()
						this.triggerEvent("edgelabelhoverstart", {
							edge,
							position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY }
						})
					}
					const pointerMove = event => {
						this.triggerEvent("edgelabelhovermove", {
							edge,
							position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY }
						})
					}
					const pointerOut = () => {
						if (edge.rendererInternals.isFocused) {
							textContainer.removeChild(textFocusBackground)
							textContainer.removeChild(textFocusBackground2)
							edge.rendererInternals.isFocused = false
							this.render()
							this.triggerEvent("edgelabelhoverend", { edge })
						}
					}
					textContainer.on("pointerover", pointerOver)
					textContainer.on("pointermove", pointerMove)
					textContainer.on("pointerout", pointerOut)
					//Make it clickable
					const onClick = event => {
						this.triggerEvent("edgelabelclick", { edge, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
					}
					const onRightClick = event => {
						this.triggerEvent("edgelabelrightclick", {
							edge,
							position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY }
						})
					}
					textContainer.on("click", onClick)
					textContainer.on("rightclick", onRightClick)
				}
				edgeLabelContainer.addChild(textContainer)
				edge.rendererInternals.text = textContainer
			}
		}
		//The order in which we add things to the stage matters, nodes need to be on top of the edges so they are added last.
		this.stage.addChild(edgesContainer)
		this.stage.addChild(edgeLabelContainer)
		this.stage.addChild(nodesContainer)
	}

	/**
	 * Initializes counters for how many edges exist between different sets of nodes
	 */
	initializeEdgeCounters() {
		const edgeMap = new Map()
		for (let i = 0; i < this.edges.length; i++) {
			const edge = this.edges[i]
			const ID = edge.sourceNode > edge.targetNode ? `${edge.sourceNode}${edge.targetNode}` : `${edge.targetNode}${edge.sourceNode}`
			if (!edgeMap.has(ID)) {
				edgeMap.set(ID, [edge])
				continue
			}
			edgeMap.get(ID).push(edge)
		}
		for (const [, edgeArray] of edgeMap) {
			for (let i = 0; i < edgeArray.length; i++) {
				const edge = edgeArray[i]
				edge.rendererInternals.edgeCounter = { total: edgeArray.length, index: i }
			}
		}
	}

	/**
	 * Initializes the lasso
	 */
	initializeLasso() {
		let initialMouse
		let moving = false
		let rect
		let lastLassoCoveredSelection = new Set()
		const onLassoStart = event => {
			if (this.lassoEnabled) {
				initialMouse = this.stage.toLocal(new PIXI.Point(event.data.global.x, event.data.global.y))
				rect = new PIXI.Graphics()
				this.stage.addChild(rect)
				rect.alpha = 0.4
				moving = true
				this.backdrop.on("globalpointermove", onLassoMove)
				this.triggerEvent("lassostart")
			}
		}
		const onLassoMove = event => {
			if (moving) {
				const currentMouse = this.stage.toLocal(new PIXI.Point(event.data.global.x, event.data.global.y))
				const width = Math.abs(currentMouse.x - initialMouse.x)
				const height = Math.abs(currentMouse.y - initialMouse.y)
				const rectTopLeftX = initialMouse.x < currentMouse.x ? initialMouse.x : currentMouse.x
				const rectTopLeftY = initialMouse.y < currentMouse.y ? initialMouse.y : currentMouse.y
				rect.clear()
				rect.rect(rectTopLeftX, rectTopLeftY, width, height)
				rect.fill(this.primaryColor)
				const lassoEndX = rectTopLeftX + width
				const lassoEndY = rectTopLeftY + height
				const coveredSelection = new Set(Array.from(lastLassoCoveredSelection))
				let selectionChanged = false
				const removedNodes = []
				const addedNodes = []
				const removedEdges = []
				const addedEdges = []
				;[...this.nodes, ...this.edges.filter(edge => edge.rendererOptions?.isInteractive && !edge.rendererInternals.isDisabled)]
					.filter(nodeOrEdge => !nodeOrEdge.rendererInternals.isDisabled)
					.forEach(nodeOrEdge => {
						const isNode = !!nodeOrEdge.shape
						const width = isNode ? nodeOrEdge.shape.width / 2 || nodeOrEdge.shape.radius : nodeOrEdge.rendererInternals.text.width / 2
						const height = isNode ? nodeOrEdge.shape.height / 2 || nodeOrEdge.shape.radius : nodeOrEdge.rendererInternals.text.height / 2
						const x = isNode ? nodeOrEdge.x : nodeOrEdge.rendererInternals.text.x
						const y = isNode ? nodeOrEdge.y : nodeOrEdge.rendererInternals.text.y
						const id = isNode ? nodeOrEdge.id : `${nodeOrEdge.sourceNode}-${nodeOrEdge.targetNode}`
						if (
							x >= Math.min(rectTopLeftX, lassoEndX) &&
							y >= Math.min(rectTopLeftY, lassoEndY) &&
							x + width <= Math.max(lassoEndX, rectTopLeftX) &&
							y + height <= Math.max(lassoEndY, rectTopLeftY)
						) {
							if (!lastLassoCoveredSelection.has(id)) {
								isNode ? addedNodes.push(nodeOrEdge) : addedEdges.push(nodeOrEdge)
								coveredSelection.add(id)
								selectionChanged = true
							}
						} else if (lastLassoCoveredSelection.has(id)) {
							isNode ? removedNodes.push(nodeOrEdge) : removedEdges.push(nodeOrEdge)
							coveredSelection.delete(id)
							selectionChanged = true
						}
					})
				if (selectionChanged) {
					this.triggerEvent("lassoupdate", { addedNodes, removedNodes, addedEdges, removedEdges, selection: Array.from(coveredSelection) })
					lastLassoCoveredSelection = coveredSelection
				}
				this.render()
			}
		}
		const onStageLassoEnd = () => {
			moving = false
			this.backdrop.removeEventListener("globalpointermove", onLassoMove)
			this.stage.removeChild(rect)
			this.triggerEvent("lassoend", { selection: Array.from(lastLassoCoveredSelection) })
			lastLassoCoveredSelection = new Set()
			this.render()
		}
		this.backdrop.on("pointerdown", onLassoStart).on("pointerup", onStageLassoEnd).on("pointerupoutside", onStageLassoEnd)
	}

	/**
	 * Toggles the lasso selector on and off
	 * @param {boolean} newStatus - If provided the lasso status will be set, otherwise toggled
	 */
	toggleLasso(newStatus) {
		this.lassoEnabled = typeof newStatus === "boolean" ? newStatus : !this.lassoEnabled
	}

	/**
	 * Selects or deselects a node.
	 * @param {import("../model/nodesandedges").RendererNode[]} nodes
	 * @param {boolean} value - Optional value to set. If ommitted current value will be toggled.
	 */
	toggleSelectNodes(nodes, value = null) {
		for (const node of nodes) {
			if (typeof value !== "boolean") {
				node.rendererInternals.isSelected = !node.rendererInternals.isSelected
			} else {
				node.rendererInternals.isSelected = value
			}
			if (node.rendererInternals.isSelected) {
				node.rendererInternals.selected.alpha = 1
			} else {
				node.rendererInternals.selected.alpha = 0
			}
		}
		this.render()
	}

	/**
	 * Selects or deselects an edge.
	 * @param {import("../model/nodesandedges").RendererEdge[]} edges
	 * @param {boolean} value - Optional value to set. If ommitted current value will be toggled.
	 */
	toggleSelectEdges(edges, value = null) {
		for (const edge of edges) {
			if (edge.rendererOptions.isInteractive) {
				if (typeof value !== "boolean") {
					edge.rendererInternals.isSelected = !edge.rendererInternals.isSelected
				} else {
					edge.rendererInternals.isSelected = value
				}
				if (edge.rendererInternals.isSelected) {
					edge.rendererInternals.selected.alpha = 1
				} else {
					edge.rendererInternals.selected.alpha = 0
				}
			}
		}
		this.render()
	}

	/**
	 * Updates the nodes and edges in the renderer.
	 * @param {import("../model/nodesandedges").RendererNode[]} nodes
	 * @param {import("../model/nodesandedges").RendererEdge[]} edges
	 */
	async updateNodesAndEdges(nodes, edges) {
		while (this.stage.children[0]) {
			this.stage.removeChild(this.stage.children[0])
		}
		this.stage.addChild(this.backdrop)
		this.nodes.forEach(node => delete node.rendererInternals)
		this.edges.forEach(edge => delete edge.rendererInternals)
		await this.initializeData(nodes, edges)
		this.initializeEdgeCounters()
		this.render()
	}

	/**
	 * Returns if the node is selected or not
	 * @param {import("../model/nodesandedges").RendererNode} node - Node to check
	 * @returns {boolean} - selected status
	 */
	isNodeSelected(node) {
		return !!node?.rendererInternals?.isSelected
	}

	/**
	 * Returns if the node is selected or not
	 * @param {import("../model/nodesandedges").RendererEdge} - Node to check
	 * @returns {boolean} - selected status
	 */
	isEdgeSelected(edge) {
		return !!edge?.rendererInternals?.isSelected
	}

	/**
	 * Clears all node selections
	 * @param {boolean} shouldRender - Should a re-render be fired after selection is updated?
	 */
	clearAllNodeSelections(shouldRender = true) {
		this.nodes.forEach(node => {
			node.rendererInternals.isSelected = false
			node.rendererInternals.selected.alpha = 0
		})
		if (shouldRender) this.render()
	}

	/**
	 * Clears all edge selections
	 * @param {boolean} shouldRender - Should a re-render be fired after selection is updated?
	 */
	clearAllEdgeSelections(shouldRender = true) {
		this.edges.forEach(edge => {
			if (edge.rendererOptions?.isInteractive) {
				edge.rendererInternals.isSelected = false
				if (edge.rendererInternals.selected) {
					edge.rendererInternals.selected.alpha = 0
				}
			}
		})
		if (shouldRender) this.render()
	}

	/**
	 * Clears all selections
	 */
	clearAllSelections() {
		this.clearAllNodeSelections(false)
		this.clearAllEdgeSelections(false)
		this.render()
	}

	/**
	 * Sets the line type for edges
	 * @param {"line" | "taxi" | "orthogonal" | "cubicbezier"} newType
	 */
	setLineType(newType) {
		this.lineType = newType
		this.render()
	}

	/**
	 * scales and moves the view so that all nodes are included in the view
	 * @param {number} duration - Time in milliseconds for the transition
	 */
	zoomToFit(duration = 200) {
		const parentWidth = this.element.clientWidth
		const parentHeight = this.element.clientHeight
		const sizeCoordinates = { lowestX: Infinity, lowestY: Infinity, highestX: -Infinity, highestY: -Infinity }
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			if (node.x - node.shape.radius < sizeCoordinates.lowestX) sizeCoordinates.lowestX = node.x - node.shape.radius
			if (node.y - node.shape.radius < sizeCoordinates.lowestY) sizeCoordinates.lowestY = node.y - node.shape.radius
			if (node.x + node.shape.radius > sizeCoordinates.highestX) sizeCoordinates.highestX = node.x + node.shape.radius
			if (node.y + node.shape.radius > sizeCoordinates.highestY) sizeCoordinates.highestY = node.y + node.shape.radius
		}
		const width = Math.abs(sizeCoordinates.highestX - sizeCoordinates.lowestX + Env.RENDERER_ZOOM_TO_FIT_PADDING)
		const height = Math.abs(sizeCoordinates.highestY - sizeCoordinates.lowestY + Env.RENDERER_ZOOM_TO_FIT_PADDING)
		const widthRatio = parentWidth / width
		const heightRatio = parentHeight / height
		const newScale = Math.min(widthRatio, heightRatio)
		const midX = (sizeCoordinates.highestX + sizeCoordinates.lowestX) / 2
		const midY = (sizeCoordinates.highestY + sizeCoordinates.lowestY) / 2
		const targetX = -(midX * newScale) + parentWidth / 2
		const targetY = -(midY * newScale) + parentHeight / 2
		const targetScale = newScale
		this.zoomTo(targetX, targetY, targetScale, duration)
	}

	/**
	 * Zooms in on a node in the graph
	 * @param {import("../model/nodesandedges").NodeID} nodeID - ID of node to zoom to
	 */
	zoomToNode(nodeID) {
		const node = this.nodes.find(node => node.id === nodeID)
		if (node) {
			const width = this.element.offsetWidth / 2
			const height = this.element.offsetHeight / 2
			const scale = 1.5
			const x = -node.x * scale + width
			const y = -node.y * scale + height
			this.zoomTo(x, y, scale)
		}
	}

	zoomTo(x, y, scale, duration = 200) {
		const startTime = Date.now()
		const sourceX = this.stage.x
		const sourceY = this.stage.y
		const sourceScale = this.stage.scale._x
		const loop = () => {
			setTimeout(() => {
				const deltaTime = Date.now() - startTime
				const percentOfAnimation = Math.min(deltaTime / duration, 1)
				const nextX = sourceX + (x - sourceX) * percentOfAnimation
				const nextY = sourceY + (y - sourceY) * percentOfAnimation
				const nextScale = sourceScale + (scale - sourceScale) * percentOfAnimation
				this.stage.updateTransform({ x: nextX, y: nextY, scaleX: nextScale, scaleY: nextScale })
				this.render()
				if (deltaTime < duration) {
					loop()
				}
			}, 1)
		}
		loop()
	}

	/**
	 * Sets new coordinates and scale for the renderer's stage
	 * @param {number} x
	 * @param {number} y
	 * @param {number} scale
	 */
	setTransform(x, y, scale) {
		this.stage.updateTransform({ x: -x + this.element.clientWidth / 2, y: -y + this.element.clientHeight / 2, scaleX: scale, scaleY: scale })
		this.render()
	}

	/**
	 * Takes coordinates from the viewport as input and returns the local (relative) coordinates in the graph
	 * @param {number} x - Viewport X coordinate
	 * @param {number} y - Viewport Y coordinate
	 */
	viewportToLocalCoordinates(x, y) {
		const newCoordinates = this.stage.toLocal({ x, y })
		return { x: newCoordinates.x, y: newCoordinates.y }
	}

	/**
	 * Takes coordinates from the graph as input and returns the corresponding viewport coordinates
	 * @param {number} x - Local X coordinate
	 * @param {number} y - Local Y coordinate
	 */
	localToViewportCoordinates(x, y) {
		const newCoordinates = this.stage.toGlobal({ x, y })
		return { x: newCoordinates.x, y: newCoordinates.y }
	}

	/**
	 * disables and grays out nodes that match a given filter function.
	 * Connected edges will also be disabled.
	 * @param {import("../model/nodesandedges").RendererNode => boolean} fn - filter function for nodes
	 */
	disableNodes(fn) {
		const includedNodes = new Set()
		this.nodes
			.filter(node => fn(node))
			.forEach(node => {
				node.rendererInternals.isDisabled = true
				includedNodes.add(node.id)
			})
		this.edges.forEach(edge => {
			if (includedNodes.has(edge.sourceNode) || includedNodes.has(edge.targetNode)) {
				edge.rendererInternals.isDisabled = true
			}
		})
		this.render()
	}

	/**
	 * Clears all disabled statuses on nodes and edges
	 */
	clearAllDisabledStatuses() {
		this.nodes.forEach(node => {
			node.rendererInternals.isDisabled = false
		})
		this.edges.forEach(edge => {
			edge.rendererInternals.isDisabled = false
		})
		this.render()
	}

	/**
	 * Cleanup function when dismounting.
	 */
	dismount() {
		this.resizeObserver.unobserve(this.element)
	}

	/**
	 * Calculates the point where the edge between the source and target node intersects the border of the target node.
	 * @param {import("../model/nodesandedges").InternalRendererNode} source - source node of the edge
	 * @param {import("../model/nodesandedges").InternalRendererNode} target - target node of the edge
	 * @param {number} additionalDistance - additional distance, or what is essentially a padding.
	 * @returns {{x: number, y: number}}
	 */
	calculateIntersection(source, target, additionalDistance) {
		const dx = target.x - source.x
		const dy = target.y - source.y
		let innerDistance = target.shape.radius

		//Rectangles require some more work...
		if (target.shape.id === "rectangle") {
			const mEdge = Math.abs(dy / dx)
			const mRect = target.shape.height / target.shape.width

			if (mEdge <= mRect) {
				const timesX = dx / (target.shape.width / 2)
				const rectY = dy / timesX
				innerDistance = Math.sqrt(Math.pow(target.shape.width / 2, 2) + rectY * rectY)
			} else {
				const timesY = dy / (target.shape.height / 2)
				const rectX = dx / timesY
				innerDistance = Math.sqrt(Math.pow(target.shape.height / 2, 2) + rectX * rectX)
			}
		}

		const length = Math.sqrt(dx * dx + dy * dy)
		const ratio = (length - (innerDistance + additionalDistance)) / length
		const x = dx * ratio + source.x
		const y = dy * ratio + source.y

		return { x, y }
	}

	/**
	 * Calculates the angle for a label in the graph
	 * @param {{x: number, y: number}} point1 - First vector of the edge
	 * @param {{x: number, y: number}} point2 - Second vector of the edge
	 */
	computeLabelAngle(point1, point2) {
		//Get the angle in degrees
		const dx = point1.x - point2.x
		const dy = point1.y - point2.y
		const theta = Math.atan2(dy, dx)
		let angle = theta * (180 / Math.PI)
		//Convert to a 360 scale
		angle += 180
		//Make sure the label is never upside-down
		if (angle > 90 && angle < 270) {
			angle -= 180
		}
		return angle
	}

	/**
	 * Calculates a point between two points for creating a curved line.
	 * @param {import("../model/nodesandedges").RendererNode} source - Point where the source node is intersected by the edge
	 * @param {import("../model/nodesandedges").RendererNode} target - Point where the target node is intersected by the edge
	 * @param {{total: number, index: number}} edgeCounter - Edge counter
	 */
	computeCurvePoint(source, target, edgeCounter) {
		const level = Math.floor((edgeCounter.index - (edgeCounter.total % 2)) / 2) + 1
		const oddConstant = (edgeCounter.total % 2) * 15
		let distance = 0
		switch (level) {
			case 1:
				distance = 20 + oddConstant
				break
			case 2:
				distance = 45 + oddConstant
				break
			default:
				break
		}

		const dx = target.x - source.x
		const dy = target.y - source.y

		const cx = source.x + dx / 2
		const cy = source.y + dy / 2

		const nx = -dy
		const ny = dx

		const vlength = Math.sqrt(nx * nx + ny * ny)
		const ratio = distance / vlength

		const n = { x: nx * ratio, y: ny * ratio }

		if (source.index < target.index) {
			n.x = -n.x
			n.y = -n.y
		}

		if (edgeCounter.index % 2 !== 0) {
			n.x = -n.x
			n.y = -n.y
		}

		return { x: cx + n.x, y: cy + n.y }
	}

	/**
	 * Calculates the radian of an angle.
	 * @param {number} angle
	 */
	computeRadian(angle) {
		angle = angle % 360
		if (angle < 0) {
			angle = angle + 360
		}
		let arc = (2 * Math.PI * angle) / 360
		if (arc < 0) {
			arc = arc + 2 * Math.PI
		}
		return arc
	}

	/**
	 * Calculates edges to its input and stores the point for the labels. Only for circle shaped nodes!
	 * @param {import("../model/nodesandedges").RendererNode} node - Edge to be processed
	 * @param {{total: number, index: number}} edgeCounter - Edge to be processed
	 * @param {number} additionalDistance - Additional padding in px
	 */
	computeSelfEdgePath(node, edgeCounter, additionalDistance = 0) {
		const loopShiftAngle = 360 / edgeCounter.total
		const loopAngle = Math.min(60, loopShiftAngle)

		const arcFrom = this.computeRadian(loopShiftAngle * edgeCounter.index)
		const arcTo = this.computeRadian(loopShiftAngle * edgeCounter.index + loopAngle)

		const x1 = Math.cos(arcFrom) * (node.shape.radius + additionalDistance)
		const y1 = Math.sin(arcFrom) * (node.shape.radius + additionalDistance)

		const x2 = Math.cos(arcTo) * (node.shape.radius + additionalDistance)
		const y2 = Math.sin(arcTo) * (node.shape.radius + additionalDistance)

		const fixPoint1 = { x: node.x + x1, y: node.y + y1 }
		const fixPoint2 = { x: node.x + x2, y: node.y + y2 }

		const distanceMultiplier = 5
		const dx = ((x1 + x2) / 2) * distanceMultiplier
		const dy = ((y1 + y2) / 2) * distanceMultiplier
		const curvePoint = { x: node.x + dx, y: node.y + dy }

		return { start: fixPoint1, end: fixPoint2, curvePoint, label: { x: node.x + dx * 0.8, y: node.y + dy * 0.8 } }
	}

	/**
	 * Main render function that updates the canvas
	 */
	render() {
		//Process nodes
		this.nodes.forEach(node => {
			//Update position
			const { x, y } = node
			node.rendererInternals.container.position = new PIXI.Point(x, y)
			//Update renderable sections based on scale
			if (this.stage.scale._x < 0.3) {
				if (node.rendererInternals?.text) node.rendererInternals.text.renderable = false
				if (node.rendererInternals?.icon) node.rendererInternals.icon.renderable = false
			} else {
				if (node.rendererInternals?.text) node.rendererInternals.text.renderable = true
				if (node.rendererInternals?.icon) node.rendererInternals.icon.renderable = true
			}
			//Update disabled state
			if (node.rendererInternals.isDisabled) {
				node.rendererInternals.node.alpha = 0.2
				node.rendererInternals.node.interactive = false
			} else {
				node.rendererInternals.node.alpha = 1
				node.rendererInternals.node.interactive = true
			}
		})
		//Process edges
		this.edges.forEach(edge => {
			//Update renderable based on scale
			if (this.stage.scale._x < 0.1) {
				edge.rendererInternals.line.renderable = false
				edge.rendererInternals.markerSource.renderable = false
				edge.rendererInternals.markerTarget.renderable = false
				if (edge.rendererInternals.text) edge.rendererInternals.text.renderable = false
				return
			} else {
				edge.rendererInternals.line.renderable = true
				edge.rendererInternals.markerSource.renderable = true
				edge.rendererInternals.markerTarget.renderable = true
				if (edge.rendererInternals.text) edge.rendererInternals.text.renderable = true
			}
			//Compute and redraw lines
			const source = edge.rendererInternals.source
			const target = edge.rendererInternals.target
			const line = edge.rendererInternals.line
			line.clear()
			line.alpha = 1
			let pathStart
			let pathEnd
			let curvePoint
			let labelPoint
			if (source === target) {
				const selfPath = this.computeSelfEdgePath(source, edge.rendererInternals.edgeCounter, this.LINE_MARGIN_PX)
				curvePoint = selfPath.curvePoint
				pathStart = selfPath.start
				pathEnd = selfPath.end
				labelPoint = selfPath.label
				line.moveTo(pathStart.x, pathStart.y)
				line.quadraticCurveTo(curvePoint.x, curvePoint.y, pathEnd.x, pathEnd.y)
			} else if (this.lineType === "taxi") {
				let midPointY
				if (edge.rendererInternals.edgeCounter.total > 1) {
					pathStart = this.calculateIntersection(target, source, this.LINE_MARGIN_PX)
					pathEnd = this.calculateIntersection(source, target, this.LINE_MARGIN_PX)
					const dividedDistance = (pathEnd.y - pathStart.y) / edge.rendererInternals.edgeCounter.total
					midPointY = pathStart.y + dividedDistance * edge.rendererInternals.edgeCounter.index + dividedDistance / 2
					curvePoint = {
						x: pathStart.x + (pathEnd.x - pathStart.x) / 2,
						y: midPointY
					}
				} else {
					curvePoint = this.computeCurvePoint(source, target, edge.rendererInternals.edgeCounter)
					pathStart = this.calculateIntersection(curvePoint, source, this.LINE_MARGIN_PX)
					pathEnd = this.calculateIntersection(curvePoint, target, this.LINE_MARGIN_PX)
					midPointY = pathStart.y + (pathEnd.y - pathStart.y) / 2
				}
				labelPoint = { x: (pathStart.x + pathEnd.x) / 2, y: midPointY }
				line.moveTo(pathStart.x, pathStart.y)
				line.lineTo(pathStart.x, midPointY)
				line.lineTo(pathEnd.x, midPointY)
				line.lineTo(pathEnd.x, pathEnd.y)
			} else if (this.lineType === "cubicbezier") {
				//TODO:: Marker angles need to be computed based on the curve rather than the angle between start and end.
				curvePoint = this.computeCurvePoint(source, target, edge.rendererInternals.edgeCounter)
				pathStart = this.calculateIntersection(curvePoint, source, this.LINE_MARGIN_PX)
				pathEnd = this.calculateIntersection(curvePoint, target, this.LINE_MARGIN_PX)
				labelPoint = { x: (pathStart.x + pathEnd.x) / 2, y: (pathStart.y + pathEnd.y) / 2 }
				line.moveTo(pathStart.x, pathStart.y)
				line.bezierCurveTo((pathStart.x + pathEnd.x) / 2, pathStart.y, (pathStart.x + pathEnd.x) / 2, pathEnd.y, pathEnd.x, pathEnd.y)
			} else if (this.lineType === "orthogonal") {
				//TODO:: Make this go faster
				const sourceWidth = edge.source.shape.width ? edge.source.shape.width : edge.source.shape.radius * 2
				const sourceHeight = edge.source.shape.height ? edge.source.shape.height : edge.source.shape.radius * 2
				const targetWidth = edge.target.shape.width ? edge.target.shape.width : edge.target.shape.radius * 2
				const targetHeight = edge.target.shape.height ? edge.target.shape.height : edge.target.shape.radius * 2
				const sourceSide = edge.rendererOptions?.sourceEdgePosition
				const targetSide = edge.rendererOptions?.targetEdgePosition
				const routeOptions = {
					pointA: {
						shape: {
							left: edge.source.x - sourceWidth / 2 - this.LINE_MARGIN_PX / 2,
							top: edge.source.y - sourceHeight / 2 - this.LINE_MARGIN_PX / 2,
							width: sourceWidth + this.LINE_MARGIN_PX,
							height: sourceHeight + this.LINE_MARGIN_PX
						},
						side: sourceSide,
						distance: 0.5
					},
					pointB: {
						shape: {
							left: edge.target.x - targetWidth / 2 - this.LINE_MARGIN_PX / 2,
							top: edge.target.y - targetHeight / 2 - this.LINE_MARGIN_PX / 2,
							width: targetWidth + this.LINE_MARGIN_PX,
							height: targetHeight + this.LINE_MARGIN_PX
						},
						side: targetSide,
						distance: 0.5
					},
					shapeMargin: this.LINE_MARGIN_PX,
					globalBoundsMargin: 100,
					globalBounds: { left: -this.sceneSize / 2, top: -this.sceneSize / 2, width: this.sceneSize, height: this.sceneSize }
				}
				const router = new OrthogonalConnector()
				const path = router.route(routeOptions)
				if (!path.length) {
					//this can occur if the sides are so close that the padding makes a path impossible.
					//If so we just exit the loop.
					return
				}
				const { x, y } = path.shift()
				const finalStep = path[path.length - 1]
				pathStart = { x, y }
				pathEnd = { x: finalStep.x, y: finalStep.y }
				labelPoint = { x: (pathStart.x + pathEnd.x) / 2, y: (pathStart.y + pathEnd.y) / 2 }
				//We hijack the curvepoint parameter to use later for positioning the markers
				curvePoint = { source: routeOptions.pointA.side, target: routeOptions.pointB.side }
				line.moveTo(x, y)
				path.forEach(path => line.lineTo(path.x, path.y))
			} else {
				//Straight lines
				curvePoint = this.computeCurvePoint(source, target, edge.rendererInternals.edgeCounter)
				pathStart = this.calculateIntersection(curvePoint, source, this.LINE_MARGIN_PX)
				pathEnd = this.calculateIntersection(curvePoint, target, this.LINE_MARGIN_PX)
				labelPoint = { x: (pathStart.x + pathEnd.x) / 2, y: (pathStart.y + pathEnd.y) / 2 }
				line.moveTo(pathStart.x, pathStart.y)
				if (edge.rendererInternals.edgeCounter.total > 1) {
					line.quadraticCurveTo(curvePoint.x, curvePoint.y, pathEnd.x, pathEnd.y)
				} else {
					line.lineTo(pathEnd.x, pathEnd.y)
				}
			}
			//Compute marker positions (arrow heads)
			if (this.lineType === "taxi" && source !== target) {
				const markerTarget = edge.rendererInternals.markerTarget
				markerTarget.angle = target.y > source.y ? 90 : 270
				markerTarget.position = new PIXI.Point(pathEnd.x, pathEnd.y)
				const markerSource = edge.rendererInternals.markerSource
				markerSource.angle = source.y > target.y ? 90 : 270
				markerSource.position = new PIXI.Point(pathStart.x, pathStart.y)
			} else if (this.lineType === "orthogonal" && source !== target) {
				const markerTarget = edge.rendererInternals.markerTarget
				markerTarget.angle = curvePoint.target === "left" ? 0 : curvePoint.target === "top" ? 90 : curvePoint.target === "right" ? 180 : 270
				markerTarget.position = new PIXI.Point(pathEnd.x, pathEnd.y)
				const markerSource = edge.rendererInternals.markerSource
				markerSource.angle = curvePoint.source === "left" ? 0 : curvePoint.source === "top" ? 90 : curvePoint.source === "right" ? 180 : 270
				markerSource.position = new PIXI.Point(pathStart.x, pathStart.y)
			} else {
				const markerTarget = edge.rendererInternals.markerTarget
				markerTarget.rotation = Math.atan2(target.y - curvePoint.y, target.x - curvePoint.x)
				markerTarget.position = new PIXI.Point(pathEnd.x, pathEnd.y)
				const markerSource = edge.rendererInternals.markerSource
				markerSource.rotation = Math.atan2(source.y - curvePoint.y, source.x - curvePoint.x)
				markerSource.position = new PIXI.Point(pathStart.x, pathStart.y)
			}
			//Complete drawing the line
			line.stroke({ width: Env.RENDERER_EDGE_WIDTH, color: this.getHexColor(edge.rendererOptions?.color || Env.DEFAULT_RENDERER_EDGE_COLOR) })
			//Compute label position (if applicable)
			const text = edge.rendererInternals.text
			if (text) {
				if (edge.sourceNode === edge.targetNode) {
					text.position = new PIXI.Point(labelPoint.x, labelPoint.y)
				} else {
					text.position = new PIXI.Point((labelPoint.x + curvePoint.x) / 2, (curvePoint.y + labelPoint.y) / 2)
				}
				if (this.lineType === "line" && this.rotateEdgeLabels) {
					text.angle = this.computeLabelAngle(source, target)
				} else {
					text.angle = 0
				}
				text.renderable = this.stage.scale._x < 0.3 ? false : true
			}
			//Update disabled state
			if (edge.rendererInternals.isDisabled) {
				edge.rendererInternals.line.alpha = 0.2
				edge.rendererInternals.markerSource.alpha = 0.2
				edge.rendererInternals.markerTarget.alpha = 0.2
				edge.rendererInternals.text && (edge.rendererInternals.text.alpha = 0.2)
				edge.rendererInternals.text && (edge.rendererInternals.text.interactive = false)
			} else {
				edge.rendererInternals.line.alpha = 1
				edge.rendererInternals.markerSource.alpha = 1
				edge.rendererInternals.markerTarget.alpha = 1
				edge.rendererInternals.text && (edge.rendererInternals.text.alpha = 1)
				edge.rendererInternals.text && (edge.rendererInternals.text.interactive = true)
			}
		})
		//https://pixijs.com/8.x/guides/migrations/v8 -> New Container Culling Approach
		PIXI.Culler.shared.cull(this.stage, this.renderer.screen)
		requestAnimationFrame(() => this.renderer.render(this.stage))
	}
}
