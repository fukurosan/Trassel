export class Tooltip {
	constructor() {
		this.tooltip = document.createElement("div")
		this.tooltip.style.position = "fixed"
		this.tooltip.style.top = "0"
		this.tooltip.style.left = "0"
		this.tooltip.style.display = "none"
		this.tooltip.style.zIndex = "9999999"
		this.tooltip.style.background = "#0f172a"
		this.tooltip.style.color = "#f1f5f9"
		this.tooltip.style.fontFamily = "sans-serif"
		this.tooltip.style.fontSize = "0.875rem"
		this.tooltip.style.lineHeight = "1.2"
		this.tooltip.style.paddingInline = "1rem"
		this.tooltip.style.paddingBlock = "0.625rem"
		this.tooltip.style.borderRadius = "0.5rem"
		this.tooltip.style.maxWidth = "200px"
		this.tooltip.style.pointerEvents = "none"

		document.body.appendChild(this.tooltip)
	}

	hideTooltip() {
		this.tooltip.style.display = "none"
	}

	/**
	 * Show the tooltip at given coordinates
	 * @param {number} x - X coordinate in the viewport where the left most side will be positioned
	 * @param {number} y - Y coordinate in the viewport where the top most side will be positioned
	 * @param {string} text - Text to show in tooltip
	 */
	showTooltip(x, y, label) {
		this.tooltip.innerHTML = ""
		this.tooltip.appendChild(document.createTextNode(label))
		this.moveTooltip(x, y)
		this.tooltip.style.display = "block"
	}

	/**
	 * Move the tooltip to given coordinates
	 * @param {number} x - X coordinate in the viewport where the left most side will be positioned
	 * @param {number} y - Y coordinate in the viewport where the top most side will be positioned
	 * @param {string} text - Text to show in tooltip
	 */
	moveTooltip(x, y) {
		this.tooltip.style.left = `${x + 5}px`
		this.tooltip.style.top = `${y + 5}px`
	}

	/**
	 * Unmounts the tooltip
	 */
	unmount() {
		this.tooltip.remove()
	}
}
