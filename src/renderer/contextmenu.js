export class ContextMenu {
	constructor() {
		this.rootElement = document.createElement("div")
		this.shadowRoot = this.rootElement.attachShadow({ mode: "open" })
		this.menu = document.createElement("div")
		this.shadowRoot.appendChild(this.menu)
		this.menu.setAttribute("style", "position:fixed;top:0;left:0;display:none;z-index:9999999;")
		document.body.appendChild(this.rootElement)
		this.menu.addEventListener("click", () => this.hideMenu())
	}

	hideMenu() {
		this.menu.style.display = "none"
	}

	/**
	 * Show the context menu at given coordinates
	 * @param {number} x - X coordinate in the viewport where the left most side will be positioned
	 * @param {number} y - Y coordinate in the viewport where the top most side will be positioned
	 * @param {import("../model/contextmenu").contextMenu[]} contextMenu - Menu sections
	 */
	showMenu(x, y, contextMenu) {
		this.menu.innerHTML = ""
		this.menu.style.left = `${x}px`
		this.menu.style.top = `${y + 10}px`
		this.menu.style.display = "block"
		this.createMenuFromSections(contextMenu, this.menu)
		const closeMenu = () => {
			this.hideMenu()
			document.removeEventListener("click", closeMenu)
		}
		document.addEventListener("click", closeMenu)
	}

	/**
	 * Creates a menu from a given number of sections and appends everything to the provided parent element
	 * @param {import("../model/contextmenu").contextMenu[]} sections - Menu sections
	 * @param {HTMLElement} parent
	 */
	createMenuFromSections(sections, parent) {
		//Parent and sub menu are the same, but for the root element only these top styles will be applied
		//Apply basic styles
		const BASE_SPACING = 0.5
		parent.style.boxShadow =
			"rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px"
		parent.style.borderRadius = `${BASE_SPACING}rem`
		parent.style.padding = `${BASE_SPACING}rem`
		parent.style.background = "#ffffff"
		parent.style.width = "max-content"
		parent.style.minWidth = "200px"
		sections.forEach(section => {
			//If this is a divider just add it and proceed to the next section
			if (section === "divider") {
				const divider = document.createElement("hr")
				divider.style.border = "1px solid #f2f3f5"
				parent.appendChild(divider)
				return 0
			}
			//Create a container for the button and potential sub-menu
			const buttonContainer = document.createElement("div")
			buttonContainer.style.display = "flex"
			buttonContainer.style.flexDirection = "column"
			buttonContainer.style.position = "relative"
			buttonContainer.style.background = "#ffffff"
			buttonContainer.style.paddingRight = `${BASE_SPACING / 2}rem`
			buttonContainer.style.marginRight = `-${BASE_SPACING / 2}rem`
			//Create the button
			const button = document.createElement("button")
			button.style.background = "inherit"
			button.style.border = "none"
			button.style.paddingBlock = `${BASE_SPACING * 0.75}rem`
			button.style.paddingInline = `${BASE_SPACING * 1.25}rem`
			button.style.borderRadius = `${BASE_SPACING / 2}rem`
			button.style.display = "grid"
			button.style.gridTemplateColumns = "auto"
			button.style.alignItems = "center"
			button.style.justifyContent = "left"
			button.style.gap = `${BASE_SPACING}rem`
			//Create the icon
			if (section.icon) {
				const img = document.createElement("img")
				img.style.minWidth = `${BASE_SPACING * 2.5}rem`
				img.style.minHeight = `${BASE_SPACING * 2.5}rem`
				img.style.width = `${BASE_SPACING * 2.5}rem`
				img.style.height = `${BASE_SPACING * 2.5}rem`
				img.style.maxWidth = `${BASE_SPACING * 2.5}rem`
				img.style.maxHeight = `${BASE_SPACING * 2.5}rem`
				img.style.objectFit = `${BASE_SPACING * 2.5}rem`
				img.src = section.icon
				button.appendChild(img)
				button.style.gridTemplateColumns = "max-content auto"
			}
			//Create the label
			const textContainer = document.createElement("div")
			textContainer.style.textAlign = "left"
			textContainer.style.fontSize = `${BASE_SPACING * 1.75}rem`
			textContainer.style.fontFamily = "sans-serif"
			textContainer.appendChild(document.createTextNode(section.label))
			button.appendChild(textContainer)
			//If there is a function action, add a click listener
			if (typeof section.action === "function") {
				button.addEventListener("click", section.action)
			}
			//If the action is a sub-menu then create it
			else if (Array.isArray(section.action)) {
				//Create chevron icon
				const img = document.createElement("div")
				img.innerHTML = `<svg width='${BASE_SPACING * 1.25 * 16}' height='${BASE_SPACING * 1.25 * 16}' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'><polyline points='7 2 18 12 7 22'></polyline></svg>`
				button.appendChild(img)
				button.style.gridTemplateColumns = section.icon ? "max-content 1fr max-content" : "auto max-content"
				//Create sub-menu
				const subMenuContainer = document.createElement("div")
				subMenuContainer.style.position = "absolute"
				subMenuContainer.style.left = "100%"
				subMenuContainer.style.top = `-${BASE_SPACING}rem` //Same as parent padding
				subMenuContainer.style.display = "none"
				this.createMenuFromSections(section.action, subMenuContainer)
				buttonContainer.addEventListener("pointerenter", () => (subMenuContainer.style.display = "block"))
				buttonContainer.addEventListener("pointerleave", () => (subMenuContainer.style.display = "none"))
				buttonContainer.appendChild(subMenuContainer)
			}
			//Add hover listeners for button to update background color
			buttonContainer.addEventListener("pointerenter", () => {
				button.style.background = "#f3f4f6"
			})
			buttonContainer.addEventListener("pointerleave", () => {
				button.style.background = "inherit"
			})
			//Add the button to the menu
			buttonContainer.appendChild(button)
			parent.appendChild(buttonContainer)
		})
	}

	/**
	 * Unmounts the tooltip
	 */
	unmount() {
		this.menu.remove()
	}
}

// Usage Example
// const cm = new ContextMenu()
// cm.showMenu(10, 10, [
// 	{
// 		label: "Option A",
// 		icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
// 		action: () => console.log("Hello World!")
// 	},
// 	"divider",
// 	{
// 		label: "Option B",
// 		icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
// 		action: [
// 			{
// 				label: "Option A",
// 				icon: "icon-url",
// 				action: () => console.log("Hello World!")
// 			},
// 			{
// 				label: "Option B",
// 				icon: "icon-url",
// 				action: [
// 					{
// 						label: "Option A",
// 						icon: "icon-url",
// 						action: () => console.log("Hello World!")
// 					},
// 					{
// 						label: "Option B",
// 						icon: "icon-url",
// 						action: () => console.log("Hello World!")
// 					}
// 				]
// 			}
// 		]
// 	},
// 	{
// 		label: "Option C",
// 		icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-zoom-in'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3Cline x1='11' y1='8' x2='11' y2='14'%3E%3C/line%3E%3Cline x1='8' y1='11' x2='14' y2='11'%3E%3C/line%3E%3C/svg%3E",
// 		action: () => console.log("Hello World!")
// 	}
// ])
