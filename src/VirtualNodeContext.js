import ExtendableProxy from "./ExtendableProxy.js";
import VirtualNode from "./VirtualNode.js";

export default class VirtualNodeContext extends ExtendableProxy {
    /** @type {VirtualNode} */ #virtualNode

    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        const parameters = { target: {}, handler: {} };
        super(parameters);
        parameters.handler.get = this.#OnGet.bind(this);
        parameters.handler.set = this.#OnSet.bind(this);
        this.#virtualNode = virtualNode;
    }

    /**
     * @param {*} object
     * @param {string | symbol} key
     * @returns {*}
     */
    #OnGet(object, key) {
        if (key in object)
            return object[key];
        if (!this.#virtualNode.IsComponent && this.#virtualNode.Parent)
            return this.#virtualNode.Parent.Context[key];
        else
            return eval(key);
    }

    /**
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     */
    #OnSet(object, key, value) {
        object[key] = value;
    }
}