import ValueChangedEventArgs from "./ValueChangedEventArgs.js";

export default class GlobalValueChangedEventArgs extends ValueChangedEventArgs {
    /** @type {any} */ #defaultEventTarget

    get DefaultEventTarget() {
        return this.#defaultEventTarget;
    }

    /**
     * @param {any} defaultEventTarget
     * @param {any} object 
     * @param {string | symbol} key 
     * @param {any} value 
     * @param {string} type
     * @param {any} sender 
     */
    constructor(defaultEventTarget, object, key, value, type, sender) {
        super(object, key, value, type, sender);

        this.#defaultEventTarget = defaultEventTarget;
    }
}