import FrameworkEventTarget from "./FrameworkEventTarget.js";

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
            const idx = observers.indexOf(e.sender);
            if (idx == -1)
                observers.push({target: e.sender, keys: [e.key]});
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
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     */
    static Dispatch(name, object, key, value) {
        this.#eventTarget.Dispatch(name, object, key, value);
    }
}