export default class FrameworkEventArgs {
    /** @type {string} */ #type
    /** @type {any} */ #sender

    get Type() {
        return this.#type;
    }

    get Sender() {
        return this.#sender;
    }

    /**
     * @param {string} type
     * @param {any} sender 
     */
    constructor(type, sender) {
        this.#type = type;
        this.#sender = sender;
    }
}