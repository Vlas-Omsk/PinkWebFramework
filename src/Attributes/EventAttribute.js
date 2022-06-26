import VirtualNode from "../VirtualNode.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class EventAttribute extends VirtualNodeAttribute {
    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        super(virtualNode);
        
        this.Update();
    }

    Update() {
        for (let attributeName in this.Element.HtmlAttributes) {
            if (attributeName.length > 1 && attributeName[0] == '@')
            {
                const eventName = attributeName.slice(1);
                this.Element.On(eventName, e => (function(script) {
                    const result = eval(script);
                    if (result instanceof Function)
                        result(e);
                }).call(this.Element.Context, this.Element.HtmlAttributes[attributeName]));
            }
        }
    }

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static Init(virtualNode) {
        if (this.#TestEventAttributes(virtualNode.HtmlAttributes))
            new EventAttribute(virtualNode);
        return false;
    }

    /**
     * @param {Object<string,string>} attributes
     * @returns {boolean}
     */
     static #TestEventAttributes(attributes) {
        for (let name in attributes)
            if (name.length > 1 && name[0] == '@')
                return true;
        return false;
    }
}