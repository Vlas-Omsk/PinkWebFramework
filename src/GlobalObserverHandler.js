import FrameworkEventTarget from "./FrameworkEventTarget.js";

/**
 * @static
 */
export default class GlobalObserverHandler {
    /** @type {FrameworkEventTarget} */ static #eventTarget = new FrameworkEventTarget();

    /**
     * @param {Function} func
     * @returns {{target: FrameworkEventTarget, keys: (string | symbol)[]}}
     */
    static GetDependentObserver(func) {
        const observers = [];
        /**
         * @param {import("./FrameworkEventTarget").ChangedEventArgs} e
         */
        const callback = e => {
            const idx = observers.indexOf(e.object);
            if (idx == -1)
                observers.push({target: e.object, test: e, keys: [e.key]});
            else
                observers[idx].keys.push(e.key);
        };
        this.#eventTarget.On("any", callback);
        func();
        this.#eventTarget.Off("any", callback);
        return observers;
    }

    /**
     * @param {string} name
     * @param {import("./FrameworkEventTarget").ChangedEventHandler} callback
     */
    static On(name, callback) {
        this.#eventTarget.On(name, callback);
    }

    /**
     * @param {string} name
     * @param {import("./FrameworkEventTarget").ChangedEventHandler} callback
     */
    static Off(name, callback) {
        this.#eventTarget.Off(name, callback);
    }

    /**
     * @param {string} name
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     */
    static Dispatch(name, object, key, value) {
        this.#eventTarget.Dispatch(name, object, key, value);
    }
}