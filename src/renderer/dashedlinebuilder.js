import * as PIXI from "pixi.js"

export class DashedLineBuilder {
	/**
	 * Creates dashed lines using PIXI Graphics objects
	 * Note that you must use moveTo before lineTo, or dashed lines will be drawn from 0, 0
	 * Simplified version based on https://github.com/davidfig/pixi-dashed-line/blob/main/lib/index.ts
	 * @param {PIXI.Graphics} graphics - Pixi graphics object to work with
	 * @param {[number, number]} dash - Array where first entry is dash length and second is gap length
	 */
	constructor(graphics, dash) {
		/** @type {PIXI.Graphics} */
		this.graphics = graphics
		this.dash = dash || [10, 5]
		this.dashSize = this.dash.reduce((a, b) => a + b)
		this.cursor = new PIXI.Point()
		this.lineLength = 0
	}

	/**
	 * Computes the distance between two vectors
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 */
	computeDistance(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
	}

	/**
	 * moveTo equivalent to Graphics.moveTo
	 * @param {number} x
	 * @param {number} y
	 */
	moveTo(x, y) {
		this.lineLength = 0
		this.cursor.set(x, y)
		this.start = new PIXI.Point(x, y)
		this.graphics.moveTo(this.cursor.x, this.cursor.y)
		return this
	}

	/**
	 * lineTo equivalent to Graphics.lineTo
	 * @param {number} x
	 * @param {number} y
	 */
	lineTo(x, y) {
		const length = this.computeDistance(this.cursor.x, this.cursor.y, x, y)
		const angle = Math.atan2(y - this.cursor.y, x - this.cursor.x)
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		let x0 = this.cursor.x
		let y0 = this.cursor.y

		// find the first part of the dash for this line
		const place = this.lineLength % this.dashSize
		let dashIndex = 0
		let dashStart = 0
		let dashX = 0
		for (let i = 0; i < this.dash.length; i++) {
			const dashSize = this.dash[i]
			if (place < dashX + dashSize) {
				dashIndex = i
				dashStart = place - dashX
				break
			} else {
				dashX += dashSize
			}
		}

		let remaining = length
		while (remaining > 0) {
			const dashSize = this.dash[dashIndex] - dashStart
			const dist = remaining > dashSize ? dashSize : remaining

			x0 += cos * dist
			y0 += sin * dist

			if (dashIndex % 2) {
				this.graphics.moveTo(x0, y0)
			} else {
				this.graphics.lineTo(x0, y0)
			}
			remaining -= dist

			dashIndex++
			dashIndex = dashIndex === this.dash.length ? 0 : dashIndex
			dashStart = 0
		}
		this.lineLength += length
		this.cursor.set(x, y)

		return this
	}

	/**
	 * circle equivalent to Graphics.circle
	 * @param {number} x
	 * @param {number} y
	 * @param {number} radius
	 * @param {number} points - How smooth the bends will be, higher number is smoother but more expensive.
	 */
	circle(x, y, radius, points = 80) {
		const interval = (Math.PI * 2) / points
		let angle = 0
		const first = new PIXI.Point(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
		this.moveTo(first.x, first.y)
		angle += interval
		for (let i = 1; i < points + 1; i++) {
			const next = i === points ? first : [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
			this.lineTo(next[0], next[1])
			angle += interval
		}
		return this
	}

	/**
	 * rect equivalent to Graphics.rect
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 * @returns
	 */
	rect(x, y, width, height) {
		this.moveTo(x, y)
			.lineTo(x + width, y)
			.lineTo(x + width, y + height)
			.lineTo(x, y + height)
			.lineTo(x, y, true)
		return this
	}

	/**
	 * Computes and creates a dashed texture and matrix transformation for a line.
	 * Can be applied in the stroke() function for the graphics object using a spread operator.
	 * someGraphics.stroke({ width: 1, ...getDirectionalTexture(x1,y1,x2,y2) })
	 * @param {number} sourceX
	 * @param {number} sourceY
	 * @param {number} targetX
	 * @param {number} targetY
	 * @returns { { texture: PIXI.Texture, matrix: PIXI.Matrix } }
	 */
	getDirectionalTexture(sourceX, sourceY, targetX, targetY) {
		const canvas = document.createElement("canvas")
		canvas.width = this.dashSize
		canvas.height = 1
		const context = canvas.getContext("2d")
		context.strokeStyle = "white"
		context.globalAlpha = 1
		context.lineWidth = 1
		let x = 0
		const y = 1 / 2
		context.moveTo(x, y)
		for (let i = 0; i < this.dash.length; i += 2) {
			x += this.dash[i]
			context.lineTo(x, y)
			if (this.dash.length !== i + 1) {
				x += this.dash[i + 1]
				context.moveTo(x, y)
			}
		}
		context.stroke()
		const texture = PIXI.Texture.from(canvas)
		const angle = Math.atan2(targetY - sourceY, targetX - sourceX)
		const matrix = new PIXI.Matrix()
		matrix.rotate(angle)
		matrix.translate(sourceX * Math.cos(angle), sourceY * Math.sin(angle))
		return {
			texture,
			matrix,
			textureSpace: "global"
		}
	}
}
