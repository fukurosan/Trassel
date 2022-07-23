/**
 * Main layout loop class.
 */
export default class Loop {
	/**
	 * @param {() => any} fn - Function to be looped
	 * @param {number=} updateCap - How many FPS to cap the update frequency to.
	 */
	constructor(fn, updateCap = 60) {
		this.fn = fn
		this.timeout = null
		this.running = false
		this.previousTimestamp = null
		this.unprocessedTime = null
		this.UPDATE_CAP = 1000 / updateCap
	}

	setUpdateCap(newCap) {
		this.UPDATE_CAP = 1000 / newCap
	}

	/**
	 * Start the loop
	 */
	start() {
		if (this.running) {
			return
		}
		this.running = true
		this.previousTimestamp = null
		this.unprocessedTime = null
		this.run()
	}

	/**
	 * Stop the loop
	 */
	stop() {
		this.running = false
		this.previousTimestamp = null
		this.unprocessedTime = null
	}

	/**
	 * Execute one loop
	 */
	run() {
		if (this.running) {
			if (!this.previousTimestamp) this.previousTimestamp = Date.now()
			if (!this.unprocessedTime) this.unprocessedTime = 0
			//If we are lagging behind, stop the unprocessed time from over-accumulating
			if (this.unprocessedTime > this.UPDATE_CAP * 10) this.unprocessedTime = this.UPDATE_CAP
			const currentTimestamp = Date.now()
			const passedTime = currentTimestamp - this.previousTimestamp
			this.previousTimestamp = currentTimestamp
			this.unprocessedTime += passedTime
			//To make the cap more accurate, change "if" to "while".
			//Note that this may lock the thread.
			//Because of the nature of settimeout, even though we specify 0 the delay will actually be longer.
			//For a cap of 60 updates per second it should not be a problem in most runtimes though.
			if (this.unprocessedTime >= this.UPDATE_CAP) {
				this.unprocessedTime -= this.UPDATE_CAP
				this.fn()
			}
			this.timeout = setTimeout(() => {
				this.run()
			}, 0)
		}
	}
}
