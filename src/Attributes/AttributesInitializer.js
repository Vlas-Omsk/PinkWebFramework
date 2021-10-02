import ValueElement, { testRegex } from "./ValueAttribute.js";
import VirtualNode from "../VirtualNode.js";
import ForAttribute from "./ForAttribute.js";
import ComponentAttribute from "./ComponentAttribute.js";
import EventAttribute from "./EventAttribute.js";
import BindAttribute from "./BindAttribute.js";

export default class AttributesInitializer {
    /**
     * @param {VirtualNode} virtualNode 
     */
    static InitAttributes(virtualNode) {
        if (this.TryInitComponentAttribute(virtualNode))
            return;
        if (this.TryInitForAttribute(virtualNode))
            return;
        if (!virtualNode.IsTemplate) {
            this.TryInitPropsAttribute(virtualNode);
            this.TryInitEventAttribute(virtualNode);
            this.TryInitValueAttribute(virtualNode);
            for (let i = 0; i < virtualNode.Elements.length; i++) {
                const element = virtualNode.Elements[i];
                if (element.IsDynamic)
                    continue;
                this.InitAttributes(element);
            }
        }
    }

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static TryInitPropsAttribute(virtualNode)
    {
        if (this.#TestPropsAttributes(virtualNode.HtmlAttributes)) {
            new BindAttribute(virtualNode);
            return true;
        }
        return false;
    }

    /**
     * @param {Object<string,string>} attributes
     * @returns {boolean}
     */
    static #TestPropsAttributes(attributes) {
        for (let name in attributes)
            if (name.length > 1 && name[0] == ':')
                return true;
        return false;
    }

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static TryInitEventAttribute(virtualNode)
    {
        if (this.#TestEventAttributes(virtualNode.HtmlAttributes)) {
            new EventAttribute(virtualNode);
            return true;
        }
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

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static TryInitComponentAttribute(virtualNode)
    {
        if (virtualNode.Tag == "component") {
            new ComponentAttribute(virtualNode);
            return true;
        }
        return false;
    }

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static TryInitForAttribute(virtualNode)
    {
        if (virtualNode.HtmlAttributes["for"]) {
            new ForAttribute(virtualNode);
            return true;
        }
        return false;
    }

    /**
     * @param {VirtualNode} virtualNode
     */
    static TryInitValueAttribute(virtualNode) {
        if (
            testRegex.test(virtualNode.Value) ||
            testRegex.test(virtualNode.Tag) ||
            this.#TestValueAttributes(virtualNode.HtmlAttributes)
        ) {
            new ValueElement(virtualNode);
            return true;
        }
        return false;
    }

    /**
     * @param {Object<string,string>} attributes
     * @returns {boolean}
     */
    static #TestValueAttributes(attributes) {
        for (let name in attributes)
            if (testRegex.test(attributes[name]) || testRegex.test(name))
                return true;
        return false;
    }
}