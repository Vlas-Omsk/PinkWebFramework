import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalValueChangedEventArgs from "./GlobalValueChangedEventArgs.js";
import ValueChangedEventArgs from "./ValueChangedEventArgs.js";

/**
 * @static
 */
export default class GlobalObserverHandler {
    /** @type {FrameworkEventTarget<GlobalValueChangedEventArgs>} */ static #eventTarget = new FrameworkEventTarget();

    /**
     * @param {Function} func
     * @returns {{target: FrameworkEventTarget<ValueChangedEventArgs>, keys: (string | symbol)[]}}
     */
    static GetDependentObserver(func) {
        const observers = [];
        /**
         * @param {GlobalValueChangedEventArgs} e
         */
        const callback = e => {
            const idx = observers.indexOf(e.DefaultEventTarget);
            if (idx == -1)
                observers.push({target: e.DefaultEventTarget, keys: [e.Key]});
            else
                observers[idx].keys.push(e.Key);
        };
        this.#eventTarget.On("any", callback);
        func();
        this.#eventTarget.Off("any", callback);
        return observers;
    }

    /**
     * @param {string} type
     * @param {import("./FrameworkEventTarget").EventHandler<GlobalValueChangedEventArgs>} callback
     */
    static On(type, callback) {
        this.#eventTarget.On(type, callback);
    }

    /**
     * @param {string} type
     * @param {import("./FrameworkEventTarget").EventHandler<GlobalValueChangedEventArgs>} callback
     */
    static Off(type, callback) {
        this.#eventTarget.Off(type, callback);
    }

    /**
     * @param {GlobalValueChangedEventArgs} eventArgs
     */
    static Dispatch(eventArgs) {
        this.#eventTarget.Dispatch(eventArgs);
    }
}