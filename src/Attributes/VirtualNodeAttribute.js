import { NotImplementedException } from "../Exceptions.js";
import VirtualNode from "../VirtualNode.js";

/**
 * @abstract
 */
export default class VirtualNodeAttribute {
    /** @type {VirtualNode} */ #element

    get Element() {
        return this.#element;
    }
    
    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        this.#element = virtualNode;
        virtualNode.AddAttribute(this);
    }

    Update() {
        throw new NotImplementedException();
    }

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static Init(virtualNode) {
        throw new NotImplementedException();
    }
}