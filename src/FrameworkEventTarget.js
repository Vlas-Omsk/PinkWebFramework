/**
 * @typedef {Object} ChangedEventArgs
 * @property {string} type
 * @property {*} object
 * @property {string | symbol} key
 * @property {*} value
 * @property {FrameworkEventTarget} sender
 */

/**
 * @callback ChangedEventHandler
 * @param {ChangedEventArgs} e
 */

export default class FrameworkEventTarget {
    /** @type {Object<string,ChangedEventHandler[]>} */ #dispatchHandlers = []

    constructor() {
    }

    /**
     * @param {string} name
     * @param {ChangedEventHandler} callback
     */
    On(name, callback) {
        if (!this.#dispatchHandlers[name])
            this.#dispatchHandlers[name] = [callback];
        else
            this.#dispatchHandlers[name].push(callback);
    }

    /**
     * @param {string} name
     * @param {ChangedEventHandler} callback
     */
    Off(name, callback) {
        if (this.#dispatchHandlers[name])
            this.#dispatchHandlers[name] =
                this.#dispatchHandlers[name] = this.#dispatchHandlers[name].filter(cb => cb != callback);
    }

    /**
     * @param {string} name
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     */
    Dispatch(name, object, key, value) {
        const event = { type: name, object, key, value, sender: this };
        if (this.#dispatchHandlers[name])
            this.#dispatchHandlers[name].forEach(callback => callback(event));
        if (this.#dispatchHandlers["any"])
            this.#dispatchHandlers["any"].forEach(callback => callback(event));
    }
}