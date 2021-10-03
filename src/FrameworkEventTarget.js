import FrameworkEventArgs from "./FrameworkEventArgs.js";

/**
 * @template {FrameworkEventArgs} T
 * @callback EventHandler
 * @param {T} e
 * @returns {void}
 */

/**
 * @template {FrameworkEventArgs} T
 */
export default class FrameworkEventTarget {
    /** @type {Object<string, EventHandler[]>} */ #dispatchHandlers = []

    constructor() {
    }

    /**
     * @param {string} type
     * @param {EventHandler<T>} callback
     */
    On(type, callback) {
        type = this.#PreProcessType(type);
        if (!this.#dispatchHandlers[type])
            this.#dispatchHandlers[type] = [callback];
        else
            this.#dispatchHandlers[type].push(callback);
    }

    /**
     * @param {string} type
     * @param {EventHandler<T>} callback
     */
    Off(type, callback) {
        type = this.#PreProcessType(type);
        if (this.#dispatchHandlers[type])
            this.#dispatchHandlers[type] =
                this.#dispatchHandlers[type] = this.#dispatchHandlers[type].filter(cb => cb != callback);
    }

    /**
     * @param {T} eventArgs
     */
    Dispatch(eventArgs) {
        const type = this.#PreProcessType(eventArgs.Type);
        if (this.#dispatchHandlers[type])
            this.#dispatchHandlers[type].forEach(callback => callback(eventArgs));
        if (this.#dispatchHandlers["any"])
            this.#dispatchHandlers["any"].forEach(callback => callback(eventArgs));
    }

    /**
     * @param {string} type 
     * @returns {string}
     */
    #PreProcessType(type) {
        return type.toLowerCase();
    }
}