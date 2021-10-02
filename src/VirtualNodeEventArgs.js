import FrameworkEventArgs from "./FrameworkEventArgs.js";

export default class VirtualNodeEventArgs extends FrameworkEventArgs {
    /** @type {any} */ #data

    get Data() {
        return this.#data;
    }

    /**
     * @param {any} data
     * @param {string} type
     * @param {any} sender 
     */
     constructor(data, type, sender) {
        super(type, sender);

        this.#data = data;
    }
}