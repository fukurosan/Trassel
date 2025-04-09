export class ZoomControls {
	/**
	 * @param {HTMLElement} element
	 * @param {WebGLRenderer} renderer
	 * @param {{ zoomTo: (x: number, y: number: scale: number) => any, zoomToFit: () => any }} renderer
	 */
	constructor(element, renderer) {
		this.element = element
		this.element.style.position = "relative"
		this.renderer = renderer
		this.buttonContainer = document.createElement("div")
		this.buttonContainer.style.display = "flex"
		this.buttonContainer.style.flexDirection = "column"
		this.buttonContainer.style.gap = "0.5rem"
		this.buttonContainer.style.position = "absolute"
		this.buttonContainer.style.bottom = "2rem"
		this.buttonContainer.style.right = "2rem"

		const zoomInButton = this.createButton()
		const zoomOutButton = this.createButton()
		const zoomToFitButton = this.createButton()

		zoomInButton.innerHTML =
			"<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'></circle><line x1='21' y1='21' x2='16.65' y2='16.65'></line><line x1='11' y1='8' x2='11' y2='14'></line><line x1='8' y1='11' x2='14' y2='11'></line></svg>"
		zoomOutButton.innerHTML =
			"<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'></circle><line x1='21' y1='21' x2='16.65' y2='16.65'></line><line x1='8' y1='11' x2='14' y2='11'></line></svg>"
		zoomToFitButton.innerHTML =
			"<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'></path></svg>"

		zoomInButton.addEventListener("click", () => this.zoomToMultiplier(2))
		zoomOutButton.addEventListener("click", () => this.zoomToMultiplier(0.5))
		zoomToFitButton.addEventListener("click", () => renderer.zoomToFit())

		this.buttonContainer.appendChild(zoomInButton)
		this.buttonContainer.appendChild(zoomOutButton)
		this.buttonContainer.appendChild(zoomToFitButton)

		element.appendChild(this.buttonContainer)
	}

	/**
	 * Creates a zoom button element
	 * @returns {HTMLButtonElement}
	 */
	createButton() {
		const button = document.createElement("button")
		button.style.background = "#ffffff"
		button.style.color = "#000000"
		button.style.border = "none"
		button.style.borderRadius = "0.375rem"
		button.style.padding = "0.5rem"
		button.style.height = "2.25rem"
		button.style.width = "2.25rem"
		button.style.display = "flex"
		button.style.alignItems = "center"
		button.style.justifyContent = "center"
		button.style.boxShadow =
			"rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px"
		return button
	}

	zoomToMultiplier(multiplier) {
		const centerX = this.element.clientWidth / 2
		const centerY = this.element.clientHeight / 2
		const stageX = this.renderer.stage.x
		const stageY = this.renderer.stage.y
		const localPointBefore = this.renderer.viewportToLocalCoordinates(centerX, centerY)
		const originalScale = this.renderer.stage.scale.x
		this.renderer.stage.updateTransform({
			x: stageX,
			y: stageY,
			scaleX: originalScale * multiplier,
			scaleY: originalScale * multiplier
		})
		const localPointAfter = this.renderer.viewportToLocalCoordinates(centerX, centerY)
		const newX = stageX + (localPointAfter.x - localPointBefore.x) * this.renderer.stage.scale.x
		const newY = stageY + (localPointAfter.y - localPointBefore.y) * this.renderer.stage.scale.y
		this.renderer.stage.updateTransform({ x: stageX, y: stageY, scaleX: originalScale, scaleY: originalScale })
		this.renderer.zoomTo(newX, newY, this.renderer.stage.scale.x * multiplier)
	}

	/**
	 * Unmounts the tooltip
	 */
	unmount() {
		this.buttonContainer.remove()
	}
}

// Testing
// new ZoomControls(document.body, {})
// document.body.style.background = "lightgray"
