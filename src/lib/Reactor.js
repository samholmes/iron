import ReactorCore from './ReactorCore.js'

export default class Reactor extends ReactorCore {
	constructor(expression) {
		super(expression)
		this.mutation = new ReactorCore({})
	}

	get v() {
		return this.state
	}
	set v(value) {
		this.state = value
	}

	get _v() {
		return this._state
	}
	set _v(value) {
		this.state = value
	}

	push(value, key = -1) {
		const index = keyToIndex(key, this._state.length + 1)
		if (typeof index === 'number') {
			this._state.splice(index, 0, value)
		} else {
			this._state[index] = value
		}
		this.mutation.state = { type: 'push', value, key: index }
		this.propagate()
	}

	pull(key = -1) {
		const index = keyToIndex(key, this._state.length)
		if (typeof index === 'number') {
			this._state.splice(index, 1)
		} else {
			delete this._state[index]
		}
		this.mutation.state = { type: 'pull', key: index }
		this.propagate()
	}

	put(value, key = -1) {
		const index = keyToIndex(key, this._state.length)
		if (typeof index === 'number') {
			this._state.splice(index, 1, value)
		} else {
			delete this._state[index]
		}
		this.mutation.state = { type: 'put', value, key: index }
		this.propagate()
	}

	map(fn) {
		// Initialize mappedReactor to a mapped array of the state
		const mappedReactor = new Reactor(this._state.map(fn))

		// React to state changes only if state is a new array
		let stateCache
		new Reactor(() => {
			if (stateCache !== this.state) {
				mappedReactor.state = this.state.map(fn)
				stateCache = this.state
			}
		})

		// React to mutations
		new ReactorCore(() => {
			const { type, key, value } = this.mutation.state

			if (type === 'push') {
				isolate(() => mappedReactor.push(fn(value, key), key))
			}
			if (type === 'pull') {
				mappedReactor.pull(key)
			}
			if (type === 'put') {
				isolate(() => mappedReactor.put(fn(value, key), key))
			}
		})

		return mappedReactor
	}
}

function isolate(fn) {
	setTimeout(fn, 0)
}

function keyToIndex(key, length) {
	if (typeof key === 'number' && typeof length !== 'undefined') {
		return key < 0 ? Math.max(0, length + key) : key
	} else {
		return key
	}
}
