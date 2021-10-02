import FrameworkEventArgs from "./FrameworkEventArgs.js";

export default class ValueChangedEventArgs extends FrameworkEventArgs {
    /** @type {any} */ #object
    /** @type {string | symbol} */ #key
    /** @type {any} */ #value

    get Object() {
        return this.#object;
    }

    get Key() {
        return this.#key;
    }

    get Value() {
        return this.#value;
    }

    /**
     * @param {any} object 
     * @param {string | symbol} key 
     * @param {any} value 
     * @param {string} type
     * @param {any} sender 
     */
    constructor(object, key, value, type, sender) {
        super(type, sender);

        this.#object = object;
        this.#key = key;
        this.#value = value;
    }
}