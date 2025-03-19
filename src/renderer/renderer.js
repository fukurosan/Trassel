import * as PIXI from "pixi.js"
import { OrthogonalConnector } from "./orthogonalRouter"

/**
 * The WebGL renderer class is a bit messy right now, and some functionality should be broken out into separate files.
 * There are also several performance optimizations that could be made. Most especially with regards to text and culling of edges.
 * This started out as a "basic" renderer, but grew into a playground for fun and interesting ideas.
 */
export class WebGLRenderer {
	constructor(element, nodes, edges, options) {
		this.element = element
		this.element.style.overflow = "hidden"
		this.nodes = nodes
		this.edges = edges
		this.options = options
		this.renderer = null
		this.stage = null
		this.backdrop = null
		this.resizeObserver = null
		this.lassoEnabled = false
		this.lineType = options?.lineType || "line"
		this.LINE_MARGIN_PX = 10
		this.sceneSize = 50000
		this.primaryColor = options?.primaryColor ? this.getHexColor(options.primaryColor) : 0x3289e2
		this.backgroundColor = this.options?.backdropColor ? this.getHexColor(this.options.backdropColor) : 0xe6e7e8
		this.listeners = new Map([
			["backdropclick", new Set()],
			["backdroprightclick", new Set()],
			["entityclick", new Set()],
			["entityrightclick", new Set()],
			["entityhoverstart", new Set()],
			["entityhoverend", new Set()],
			["entitydragstart", new Set()],
			["entitydragmove", new Set()],
			["entitydragend", new Set()],
			["edgelabelhoverstart", new Set()],
			["edgelabelhoverend", new Set()],
			["edgelabelclick", new Set()],
			["edgelabelrightclick", new Set()],
			["canvasdragstart", new Set()],
			["canvasdragend", new Set()],
			["lassostart", new Set()],
			["lassoupdate", new Set()],
			["lassoend", new Set()]
		])
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
	 * @param {string} name - Event name to listen for
	 * @param {(...any) => any} fn - Callback on event
	 */
	on(name, fn) {
		if (!this.listeners.has(name)) {
			console.error(`No such event name: ${name}`)
		}
		this.listeners.get(name).add(fn)
	}

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
			preference: "webgpu",
			resolution: 2,
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
				this.triggerEvent("canvasdragstart")
			}
		}
		const onStageDragMove = event => {
			if (mouseDrag) {
				blockCanvasClick = true
				this.stage.x = event.data.global.x - initialMouseX
				this.stage.y = event.data.global.y - initialMouseY
				requestAnimationFrame(() => this.renderer.render(this.stage))
			}
		}
		const onStageDragEnd = () => {
			if (mouseDrag) {
				mouseDrag = false
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
			.on("pointermove", onStageDragMove)
			.on("pointerup", onStageDragEnd)
			.on("pointerupoutside", onStageDragEnd)
			.on("click", onClick)
			.on("rightclick", onRightClick)
	}

	/**
	 * makes the canvas zoomable
	 */
	initializeZoom() {
		const maxScale = 4
		const minScale = 0.05
		const handleZoom = event => {
			event.stopPropagation()
			event.preventDefault()
			const mouseX = event.clientX
			const mouseY = event.clientY
			const localPointBefore = this.stage.toLocal(new PIXI.Point(mouseX, mouseY))
			const alpha = 1 + Math.abs(event.wheelDelta) / 2000
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
				this.render()
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
	 * @param {import("../model/rendereroptions").INodeWithRendererOptions[]} nodes
	 * @param {import("../model/rendereroptions").IEdgeWithRendererOptions[]} edges
	 */
	async initializeData(nodes, edges) {
		const FOCUS_SHAPE_SIZE_HALF = 6
		this.nodes = nodes
		this.edges = edges
		const nodeLookupMap = new Map()
		const stageNodes = []
		//Initializes Nodes
		for (const node of this.nodes) {
			nodeLookupMap.set(node.id, node)
			if (!node.renderer) node.renderer = {}
			if (node.renderer.shape === "rectangle") {
				!node.width && (node.width = 50)
				!node.height && (node.height = 50)
				!node.radius && (node.radius = Math.max(node.width, node.height) / 2)
			} else {
				!node.radius && (node.radius = 50)
			}
			node.renderer._private = {
				container: new PIXI.Container(),
				node: new PIXI.Graphics(),
				text: null,
				icon: null,
				selected: new PIXI.Graphics(),
				isFocused: false,
				isSelected: false
			}
			//Draw shape
			const nodeGfx = node.renderer._private.node
			const nodeShape = node.renderer.shape
			const nodeHeight = node.height || node.radius * 2
			const nodeWidth = node.width || node.radius * 2
			if (nodeShape === "rectangle") {
				nodeGfx.roundRect(-(nodeWidth / 2), -(nodeHeight / 2), nodeWidth, nodeHeight, 4)
			} else {
				nodeGfx.circle(0, 0, node.radius)
			}
			nodeGfx.fill(this.getHexColor(node.renderer.backgroundColor || 0xffffff))
			nodeGfx.stroke({ width: 2, color: 0xffffff })
			//Draw label
			const fontSize = Math.max(nodeHeight * 0.1, 12)
			const icon = node.renderer.icon
			const iconMaxSize = 50
			const iconMinSize = 16
			const iconSize = Math.max(Math.min(nodeHeight * 0.2, iconMaxSize), iconMinSize)
			const wordWrapWidth = nodeShape === "rectangle" ? (icon ? nodeWidth - iconSize * 3 : nodeWidth - iconSize * 2) : node.radius * 1.25
			const textStyle = new PIXI.TextStyle({
				fontFamily: "Arial",
				fontSize,
				wordWrap: true,
				breakWords: true,
				wordWrapWidth,
				align: "center",
				fill: this.getHexColor(node.renderer.textColor || 0x000000)
			})
			const label = node.renderer.label || node.id
			const measurements = PIXI.CanvasTextMetrics.measureText(label, textStyle)
			let processedLabel = measurements.lines.shift()
			const shouldWrapText = (nodeShape === "rectangle" && nodeHeight > 50) || (nodeShape !== "rectangle" && node.radius > 40)
			if (measurements.lines.length && shouldWrapText) {
				processedLabel = `${processedLabel}\n${measurements.lines.shift()}`
			}
			if (measurements.lines.length) {
				processedLabel = `${processedLabel.slice(0, processedLabel.length - 2)}..`
			}
			const text = new PIXI.Text({ text: processedLabel, style: textStyle })
			text.resolution = 3
			text.anchor.set(0.5)
			nodeGfx.addChild(text)
			node.renderer._private.text = text
			//Draw icon
			if (node.renderer.icon) {
				const texture = await PIXI.Assets.load(node.renderer.icon)
				const icon = PIXI.Sprite.from(texture)
				icon.width = iconSize
				icon.height = iconSize
				icon.anchor.x = 0.5
				icon.anchor.y = 0.5
				text.anchor.y = 0.5
				text.anchor.x = 0.5
				nodeGfx.addChild(icon)
				if (nodeShape === "rectangle") {
					icon.x = -measurements.maxLineWidth / 2 - icon.width / 2
					text.x = iconSize / 2
				} else {
					icon.anchor.y = 1.2
					text.anchor.y = 0
				}
				node.renderer._private.icon = icon
			}
			//Add selection graphics
			const selectedGfx = node.renderer._private.selected
			if (node.renderer.shape === "rectangle") {
				selectedGfx.roundRect(
					-(node.width / 2 + FOCUS_SHAPE_SIZE_HALF),
					-(node.height / 2 + FOCUS_SHAPE_SIZE_HALF),
					node.width + FOCUS_SHAPE_SIZE_HALF * 2,
					node.height + FOCUS_SHAPE_SIZE_HALF * 2,
					12
				)
			} else {
				selectedGfx.circle(0, 0, node.radius + FOCUS_SHAPE_SIZE_HALF)
			}
			selectedGfx.fill(this.primaryColor)
			selectedGfx.alpha = 0
			node.renderer._private.container.addChild(selectedGfx)
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
				dragEventData = null
				this.triggerEvent("entitydragend", { node })
			}
			nodeGfx.on("pointerdown", onDragStart)
			nodeGfx.on("pointermove", onDragMove)
			this.backdrop.on("pointermove", onDragMove) //Added in pixi v7 since pointermove will no longer fire when quickly moving cursor outside hit box
			nodeGfx.on("pointerup", onDragEnd)
			nodeGfx.on("pointerupoutside", onDragEnd)
			//Give node hover effect
			const focusGfx = new PIXI.Graphics()
			const focusGfx2 = new PIXI.Graphics()
			focusGfx.alpha = 0.2
			focusGfx2.alpha = 0.1
			if (node.renderer.shape === "rectangle") {
				focusGfx.roundRect(
					-(node.width / 2 + FOCUS_SHAPE_SIZE_HALF),
					-(node.height / 2 + FOCUS_SHAPE_SIZE_HALF),
					node.width + FOCUS_SHAPE_SIZE_HALF * 2,
					node.height + FOCUS_SHAPE_SIZE_HALF * 2,
					12
				)
				focusGfx2.roundRect(
					-(node.width / 2 + FOCUS_SHAPE_SIZE_HALF * 2),
					-(node.height / 2 + FOCUS_SHAPE_SIZE_HALF * 2),
					node.width + FOCUS_SHAPE_SIZE_HALF * 4,
					node.height + FOCUS_SHAPE_SIZE_HALF * 4,
					16
				)
			} else {
				focusGfx.circle(0, 0, node.radius + FOCUS_SHAPE_SIZE_HALF)
				focusGfx2.circle(0, 0, node.radius + FOCUS_SHAPE_SIZE_HALF * 2)
			}
			focusGfx.fill(this.primaryColor)
			focusGfx2.fill(this.primaryColor)
			const pointerOver = () => {
				if (!dragging) {
					node.renderer._private.container.addChildAt(focusGfx, 0)
					node.renderer._private.container.addChildAt(focusGfx2, 0)
					node.renderer._private.isFocused = true
					this.render()
				}
			}
			const pointerOut = () => {
				if (node.renderer._private.isFocused) {
					node.renderer._private.container.removeChild(focusGfx)
					node.renderer._private.container.removeChild(focusGfx2)
					node.renderer._private.isFocused = false
					this.render()
				}
			}
			nodeGfx.on("pointerover", pointerOver)
			nodeGfx.on("pointerout", pointerOut)
			//Make node clickable
			const onClick = event => {
				if (!blockClick) {
					this.triggerEvent("entityclick", { node, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
				}
			}
			const onRightClick = event => {
				if (!blockClick) {
					this.triggerEvent("entityclick", { node, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
				}
			}
			nodeGfx.on("click", onClick)
			nodeGfx.on("rightclick", onRightClick)
			//Add node to stage
			node.renderer._private.container.addChild(nodeGfx)
			node.renderer._private.container.cullable = true
			stageNodes.push(node)
		}
		//Initialize Edges
		for (const edge of this.edges) {
			//Initialize edge properties
			if (!edge.renderer) edge.renderer = {}
			const markerSourceAsset = await PIXI.Assets.load(edge.renderer.markerSource ? this.markers[edge.renderer.markerSource] : this.markers.none)
			const markerTargetAsset = await PIXI.Assets.load(edge.renderer.markerTarget ? this.markers[edge.renderer.markerTarget] : this.markers.arrow)
			const markerSource = PIXI.Sprite.from(markerSourceAsset)
			const markerTarget = PIXI.Sprite.from(markerTargetAsset)
			const markerSize = 16
			markerSource.width = markerSize
			markerSource.height = markerSize
			markerTarget.width = markerSize
			markerTarget.height = markerSize
			edge.renderer._private = {
				source: nodeLookupMap.get(edge.sourceNode),
				target: nodeLookupMap.get(edge.targetNode),
				container: new PIXI.Container(),
				line: new PIXI.Graphics(),
				markerSource,
				markerTarget,
				text: null
			}
			edge.renderer._private.container.addChild(edge.renderer._private.line)
			edge.renderer._private.container.addChild(edge.renderer._private.markerSource)
			edge.renderer._private.container.addChild(edge.renderer._private.markerTarget)
			edge.renderer._private.markerSource.anchor.set(0.45, 0.25)
			edge.renderer._private.markerTarget.anchor.set(0.45, 0.25)
			edge.renderer._private.container.cullable = true
			this.stage.addChild(edge.renderer._private.container)
			//Initialize label
			if (edge.renderer.label) {
				const textStyle = new PIXI.TextStyle({
					fontFamily: "Arial",
					fontSize: 10,
					wordWrap: true,
					breakWords: true,
					align: "center",
					wordWrapWidth: (edge.distance || 100) * 0.5,
					fill: this.getHexColor(edge.renderer.labelColor || 0x000000)
				})
				const label = edge.renderer.label
				const measurements = PIXI.CanvasTextMetrics.measureText(label, textStyle)
				let processedLabel = measurements.lines[0]
				if (measurements.lines.length > 1) {
					processedLabel = `${processedLabel.slice(0, processedLabel.length - 2)}..`
				}
				const text = new PIXI.Text({ text: processedLabel, style: textStyle })
				text.resolution = 3
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
				if (edge.renderer.isInteractive) {
					text.anchor.y = 0.5
					const width = text.width + 10
					const height = text.height + 10
					const textBackground = new PIXI.Graphics()
					textBackground.alpha = 1
					textBackground.roundRect(-width / 2, -height / 2, width, height, 4)
					textBackground.fill(this.getHexColor(edge.renderer.labelBackgroundColor || 0xffffff))
					textBackground.stroke({ width: 2, color: this.getHexColor(edge.renderer.labelBackgroundColor || 0xffffff) })
					textContainer.addChildAt(textBackground, 0)
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
						edge.renderer._private.isFocused = true
						this.render()
						this.triggerEvent("edgelabelhoverstart", {
							edge,
							position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY }
						})
					}
					const pointerOut = event => {
						if (edge.renderer._private.isFocused) {
							textContainer.removeChild(textFocusBackground)
							textContainer.removeChild(textFocusBackground2)
							edge.renderer._private.isFocused = false
							this.render()
							this.triggerEvent("edgelabelhoverend", {
								edge,
								position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY }
							})
						}
					}
					const onClick = event => {
						this.triggerEvent("edgelabelclick", { edge, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
					}
					const onRightClick = event => {
						this.triggerEvent("edgelabelclick", { edge, position: { x: event.data.originalEvent.screenX, y: event.data.originalEvent.screenY } })
					}
					textContainer.on("pointerover", pointerOver)
					textContainer.on("pointerout", pointerOut)
					textContainer.on("click", onClick)
					textContainer.on("rightclick", onRightClick)
				}
				edge.renderer._private.container.addChild(textContainer)
				edge.renderer._private.text = textContainer
			}
		}
		stageNodes.forEach(node => {
			this.stage.addChild(node.renderer._private.container)
		})
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
				edge.renderer._private.edgeCounter = { total: edgeArray.length, index: i }
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
				const removed = []
				const added = []
				this.nodes.forEach(node => {
					if (
						node.x >= Math.min(rectTopLeftX, lassoEndX) &&
						node.y >= Math.min(rectTopLeftY, lassoEndY) &&
						node.x + (node.width || node.radius) <= Math.max(lassoEndX, rectTopLeftX) &&
						node.y + (node.height || node.radius) <= Math.max(lassoEndY, rectTopLeftY)
					) {
						if (!lastLassoCoveredSelection.has(node.id)) {
							added.push(node)
							coveredSelection.add(node.id)
							selectionChanged = true
						}
					} else if (lastLassoCoveredSelection.has(node.id)) {
						removed.push(node)
						coveredSelection.delete(node.id)
						selectionChanged = true
					}
				})
				if (selectionChanged) {
					this.triggerEvent("lassoupdate", { added, removed, selection: Array.from(coveredSelection) })
					lastLassoCoveredSelection = coveredSelection
				}
				this.render()
			}
		}
		const onStageLassoEnd = () => {
			moving = false
			this.stage.removeChild(rect)
			this.triggerEvent("lassoend", { selection: Array.from(lastLassoCoveredSelection) })
			lastLassoCoveredSelection = new Set()
			this.render()
		}
		this.backdrop
			.on("pointerdown", onLassoStart)
			.on("globalpointermove", onLassoMove)
			.on("pointerup", onStageLassoEnd)
			.on("pointerupoutside", onStageLassoEnd)
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
	 * @param {import("../model/rendereroptions").INodeWithRendererOptions} node
	 * @param {boolean} value - Optional value to set. If ommitted current value will be toggled.
	 */
	toggleSelectNode(node, value = null) {
		if (typeof value !== "boolean") {
			node.renderer._private.isSelected = !node.renderer._private.isSelected
		} else {
			node.renderer._private.isSelected = value
		}
		if (node.renderer._private.isSelected) {
			node.renderer._private.selected.alpha = 1
		} else {
			node.renderer._private.selected.alpha = 0
		}
		this.render()
	}

	/**
	 * Updates the nodes and edges in the renderer.
	 * @param {import("../model/rendereroptions").INodeWithRendererOptions[]} nodes
	 * @param {import("../model/rendereroptions").IEdgeWithRendererOptions[]} edges
	 */
	async updateNodesAndEdges(nodes, edges) {
		while (this.stage.children[0]) {
			this.stage.removeChild(this.stage.children[0])
		}
		this.stage.addChild(this.backdrop)
		this.nodes.forEach(node => delete node.renderer._private)
		this.edges.forEach(edge => delete edge.renderer._private)
		await this.initializeData(nodes, edges)
		this.render()
	}

	/**
	 * Returns if the node is selected or not
	 * @param {import("../model/ibasicnode").IBasicNode} - Node to check
	 * @returns {boolean} - selected status
	 */
	isNodeSelected(node) {
		return !!node?.renderer?._private?.isSelected
	}

	/**
	 * Clears all node selections
	 */
	clearAllNodeSelections() {
		this.nodes.forEach(node => {
			node.renderer._private.isSelected = false
			node.renderer._private.selected.alpha = 0
		})
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
		const PADDING_PX = 250
		const parentWidth = this.element.clientWidth
		const parentHeight = this.element.clientHeight
		const sizeCoordinates = { lowestX: Infinity, lowestY: Infinity, highestX: -Infinity, highestY: -Infinity }
		let node
		for (let i = 0; i < this.nodes.length; i++) {
			node = this.nodes[i]
			if (node.x - node.radius < sizeCoordinates.lowestX) sizeCoordinates.lowestX = node.x - node.radius
			if (node.y - node.radius < sizeCoordinates.lowestY) sizeCoordinates.lowestY = node.y - node.radius
			if (node.x + node.radius > sizeCoordinates.highestX) sizeCoordinates.highestX = node.x + node.radius
			if (node.y + node.radius > sizeCoordinates.highestY) sizeCoordinates.highestY = node.y + node.radius
		}
		const width = Math.abs(sizeCoordinates.highestX - sizeCoordinates.lowestX + PADDING_PX)
		const height = Math.abs(sizeCoordinates.highestY - sizeCoordinates.lowestY + PADDING_PX)
		const widthRatio = parentWidth / width
		const heightRatio = parentHeight / height
		const newScale = Math.min(widthRatio, heightRatio)
		const midX = (sizeCoordinates.highestX + sizeCoordinates.lowestX) / 2
		const midY = (sizeCoordinates.highestY + sizeCoordinates.lowestY) / 2
		const animation = {
			sourceX: this.stage.x,
			sourceY: this.stage.y,
			sourceScale: this.stage.scale.x,
			targetX: -midX + parentWidth / 2,
			targetY: -midY + parentHeight / 2,
			targetScale: newScale
		}
		const startTime = Date.now()
		const loop = () => {
			setTimeout(() => {
				const deltaTime = Date.now() - startTime
				const percentOfAnimation = Math.min(deltaTime / duration, 100)
				const nextX = animation.sourceX + (animation.targetX - animation.sourceX) * percentOfAnimation
				const nextY = animation.sourceY + (animation.targetY - animation.sourceY) * percentOfAnimation
				const nextScale = animation.sourceScale + (animation.targetScale - animation.sourceScale) * percentOfAnimation
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
	 * @param {import("../model/rendereroptions").INodeWithRendererOptions => boolean} fn - filter function for nodes
	 */
	disableNodes(fn) {
		this.clearAllFilters()
		const includedNodes = new Set()
		this.nodes
			.filter(node => fn(node))
			.forEach(node => {
				node.renderer._private.isDisabled = true
				includedNodes.add(node.id)
			})
		this.edges.forEach(edge => {
			if (includedNodes.has(edge.sourceNode) || includedNodes.has(edge.targetNode)) {
				edge.renderer._private.isDisabled = true
			}
		})
		this.render()
	}

	/**
	 * Clears all disabled statuses on nodes and edges
	 */
	clearAllDisabledStatuses() {
		this.nodes.forEach(node => {
			node.renderer._private.isDisabled = false
		})
		this.edges.forEach(edge => {
			edge.renderer._private.isDisabled = false
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
	 * @param {{shape: string, x: number, y: number}} source - source node of the edge
	 * @param {{shape: string, x: number, y: number}} target - target node of the edge
	 * @param {number} additionalDistance - additional distance, or what is essentially a padding.
	 * @returns {{x: number, y: number}}
	 */
	calculateIntersection(source, target, additionalDistance) {
		const dx = target.x - source.x
		const dy = target.y - source.y
		let innerDistance = target.radius

		//Rectangles require some more work...
		if (target.renderer.shape === "rectangle") {
			const mEdge = Math.abs(dy / dx)
			const mRect = target.height / target.width

			if (mEdge <= mRect) {
				const timesX = dx / (target.width / 2)
				const rectY = dy / timesX
				innerDistance = Math.sqrt(Math.pow(target.width / 2, 2) + rectY * rectY)
			} else {
				const timesY = dy / (target.height / 2)
				const rectX = dx / timesY
				innerDistance = Math.sqrt(Math.pow(target.height / 2, 2) + rectX * rectX)
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
	 * @param {object} source - Point where the source node is intersected by the edge
	 * @param {object} target - Point where the target node is intersected by the edge
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
	 * @param {{radius: number, x: number, y: number}} node - Edge to be processed
	 * @param {{total: number, index: number}} edgeCounter - Edge to be processed
	 * @param {number} additionalDistance - Additional padding in px
	 */
	computeSelfEdgePath(node, edgeCounter, additionalDistance = 0) {
		const loopShiftAngle = 360 / edgeCounter.total
		const loopAngle = Math.min(60, loopShiftAngle)

		const arcFrom = this.computeRadian(loopShiftAngle * edgeCounter.index)
		const arcTo = this.computeRadian(loopShiftAngle * edgeCounter.index + loopAngle)

		const x1 = Math.cos(arcFrom) * (node.radius + additionalDistance)
		const y1 = Math.sin(arcFrom) * (node.radius + additionalDistance)

		const x2 = Math.cos(arcTo) * (node.radius + additionalDistance)
		const y2 = Math.sin(arcTo) * (node.radius + additionalDistance)

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
		this.nodes.forEach(node => {
			const { x, y } = node
			node.renderer._private.container.position = new PIXI.Point(x, y)
			if (this.stage.scale._x < 0.3) {
				if (node.renderer._private?.text) node.renderer._private.text.renderable = false
				if (node.renderer._private?.icon) node.renderer._private.icon.renderable = false
			} else {
				if (node.renderer._private?.text) node.renderer._private.text.renderable = true
				if (node.renderer._private?.icon) node.renderer._private.icon.renderable = true
			}
			if (node.renderer._private.isDisabled) {
				node.renderer._private.node.alpha = 0.2
				node.renderer._private.node.interactive = false
			} else {
				node.renderer._private.node.alpha = 1
				node.renderer._private.node.interactive = true
			}
		})
		this.edges.forEach(edge => {
			if (this.stage.scale._x < 0.1) {
				edge.renderer._private.line.renderable = false
				edge.renderer._private.markerSource.renderable = false
				edge.renderer._private.markerTarget.renderable = false
				if (edge.renderer._private.text) edge.renderer._private.text.renderable = false
				return
			} else {
				edge.renderer._private.line.renderable = true
				edge.renderer._private.markerSource.renderable = true
				edge.renderer._private.markerTarget.renderable = true
				if (edge.renderer._private.text) edge.renderer._private.text.renderable = true
			}
			const source = edge.renderer._private.source
			const target = edge.renderer._private.target
			const line = edge.renderer._private.line
			line.clear()
			line.alpha = 1
			let pathStart
			let pathEnd
			let curvePoint
			let labelPoint
			if (source === target) {
				const selfPath = this.computeSelfEdgePath(source, edge.renderer._private.edgeCounter, this.LINE_MARGIN_PX)
				curvePoint = selfPath.curvePoint
				pathStart = selfPath.start
				pathEnd = selfPath.end
				labelPoint = selfPath.label
				line.moveTo(pathStart.x, pathStart.y)
				line.quadraticCurveTo(curvePoint.x, curvePoint.y, pathEnd.x, pathEnd.y)
			} else if (this.lineType === "taxi") {
				curvePoint = this.computeCurvePoint(source, target, edge.renderer._private.edgeCounter)
				pathStart = this.calculateIntersection(curvePoint, source, this.LINE_MARGIN_PX)
				pathEnd = this.calculateIntersection(curvePoint, target, this.LINE_MARGIN_PX)
				labelPoint = { x: (pathStart.x + pathEnd.x) / 2, y: (pathStart.y + pathEnd.y) / 2 }
				const midPointY = pathStart.y + (pathEnd.y - pathStart.y) / 2
				line.moveTo(pathStart.x, pathStart.y)
				line.lineTo(pathStart.x, midPointY)
				line.lineTo(pathEnd.x, midPointY)
				line.lineTo(pathEnd.x, pathEnd.y)
			} else if (this.lineType === "cubicbezier") {
				//TODO:: Marker angles need to be computed based on the curve rather than the angle between start and end.
				curvePoint = this.computeCurvePoint(source, target, edge.renderer._private.edgeCounter)
				pathStart = this.calculateIntersection(curvePoint, source, this.LINE_MARGIN_PX)
				pathEnd = this.calculateIntersection(curvePoint, target, this.LINE_MARGIN_PX)
				labelPoint = { x: (pathStart.x + pathEnd.x) / 2, y: (pathStart.y + pathEnd.y) / 2 }
				line.moveTo(pathStart.x, pathStart.y)
				line.bezierCurveTo((pathStart.x + pathEnd.x) / 2, pathStart.y, (pathStart.x + pathEnd.x) / 2, pathEnd.y, pathEnd.x, pathEnd.y)
			} else if (this.lineType === "orthogonal") {
				//TODO:: Make this go faster
				const sourceWidth = edge.source.width ? edge.source.width : edge.source.radius * 2
				const sourceHeight = edge.source.height ? edge.source.height : edge.source.radius * 2
				const targetWidth = edge.target.width ? edge.target.width : edge.target.radius * 2
				const targetHeight = edge.target.height ? edge.target.height : edge.target.radius * 2
				const sourceSide = edge.renderer.sourceEdgePosition
				const targetSide = edge.renderer.targetEdgePosition
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
				curvePoint = this.computeCurvePoint(source, target, edge.renderer._private.edgeCounter)
				pathStart = this.calculateIntersection(curvePoint, source, this.LINE_MARGIN_PX)
				pathEnd = this.calculateIntersection(curvePoint, target, this.LINE_MARGIN_PX)
				labelPoint = { x: (pathStart.x + pathEnd.x) / 2, y: (pathStart.y + pathEnd.y) / 2 }
				line.moveTo(pathStart.x, pathStart.y)
				line.quadraticCurveTo(curvePoint.x, curvePoint.y, pathEnd.x, pathEnd.y)
			}
			if (this.lineType === "taxi" && source !== target) {
				const markerTarget = edge.renderer._private.markerTarget
				markerTarget.angle = target.y > source.y ? 90 : 270
				markerTarget.position = new PIXI.Point(pathEnd.x, pathEnd.y)
				const markerSource = edge.renderer._private.markerSource
				markerSource.angle = source.y > target.y ? 90 : 270
				markerSource.position = new PIXI.Point(pathStart.x, pathStart.y)
			} else if (this.lineType === "orthogonal" && source !== target) {
				const markerTarget = edge.renderer._private.markerTarget
				markerTarget.angle = curvePoint.target === "left" ? 0 : curvePoint.target === "top" ? 90 : curvePoint.target === "right" ? 180 : 270
				markerTarget.position = new PIXI.Point(pathEnd.x, pathEnd.y)
				const markerSource = edge.renderer._private.markerSource
				markerSource.angle = curvePoint.source === "left" ? 0 : curvePoint.source === "top" ? 90 : curvePoint.source === "right" ? 180 : 270
				markerSource.position = new PIXI.Point(pathStart.x, pathStart.y)
			} else {
				const markerTarget = edge.renderer._private.markerTarget
				markerTarget.rotation = Math.atan2(target.y - curvePoint.y, target.x - curvePoint.x)
				markerTarget.position = new PIXI.Point(pathEnd.x, pathEnd.y)
				const markerSource = edge.renderer._private.markerSource
				markerSource.rotation = Math.atan2(source.y - curvePoint.y, source.x - curvePoint.x)
				markerSource.position = new PIXI.Point(pathStart.x, pathStart.y)
			}
			line.stroke({ width: 1, color: this.getHexColor(edge.renderer.color || 0x000000) })
			const text = edge.renderer._private.text
			if (text) {
				text.position = new PIXI.Point(labelPoint.x, labelPoint.y)
				if (this.lineType === "line") {
					text.angle = this.computeLabelAngle(source, target)
				}
				text.alpha = this.stage.scale._x < 0.3 ? 0 : 1
			}
			if (edge.renderer._private.isDisabled) {
				edge.renderer._private.line.alpha = 0.2
				edge.renderer._private.markerSource.alpha = 0.2
				edge.renderer._private.markerTarget.alpha = 0.2
				edge.renderer._private.text && (edge.renderer._private.text.alpha = 0.2)
				edge.renderer._private.text && (edge.renderer._private.text.interactive = false)
			} else {
				edge.renderer._private.line.alpha = 1
				edge.renderer._private.markerSource.alpha = 1
				edge.renderer._private.markerTarget.alpha = 1
				edge.renderer._private.text && (edge.renderer._private.text.alpha = 1)
				edge.renderer._private.text && (edge.renderer._private.text.interactive = true)
			}
		})
		requestAnimationFrame(() => this.renderer.render(this.stage))
	}
}
