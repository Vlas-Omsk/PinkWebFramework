import VirtualNode from "../VirtualNode.js";
import ForAttribute from "./ForAttribute.js";
import ComponentAttribute from "./ComponentAttribute.js";
import EventAttribute from "./EventAttribute.js";
import BindAttribute from "./BindAttribute.js";
import RefAttribute from "./RefAttribute.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";
import ValueAttribute from "./ValueAttribute.js";
import IfAttribute from "./IfAttribute.js";

export default class AttributesInitializer {
    /** @type {VirtualNodeAttribute[]} */ static #attributesQueue = [
        ComponentAttribute,
        ForAttribute,
        RefAttribute,
        BindAttribute,
        EventAttribute,
        IfAttribute,
        ValueAttribute
    ]

    /**
     * @param {any} attributeObject 
     */
    static AddAttribute(attributeObject) {
        this.#attributesQueue.push(attributeObject);
    }

    /**
     * @param {VirtualNode} virtualNode 
     */
    static InitAttributes(virtualNode) {
        virtualNode.OnBeforeInitialize();

        for (const attributeObject of this.#attributesQueue) {
            if (attributeObject.Init(virtualNode))
                break;
        }

        if (!virtualNode.IsTemplate) {
            for (let i = 0; i < virtualNode.Elements.length; i++) {
                const element = virtualNode.Elements[i];
                if (element.IsDynamic)
                    continue;
                this.InitAttributes(element);
            }
        }

        virtualNode.OnInitialized();
    }
}