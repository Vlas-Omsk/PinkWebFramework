import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class RefAttribute extends VirtualNodeAttribute {
    constructor(virtualNode) {
        super(virtualNode);

        this.Update();
    }

    Update() {
        for (let attributeName in this.Element.HtmlAttributes) {
            if (attributeName == "ref") {
                this.Element.RefName = this.Element.HtmlAttributes[attributeName];
                this.Element.RemoveHtmlAttribute(attributeName);
            }
        }
    }

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static Init(virtualNode) {
        if (this.#TestRefAttributes(virtualNode.HtmlAttributes))
            new RefAttribute(virtualNode);
        return false;
    }

    /**
     * @param {Object<string,string>} attributes
     * @returns {boolean}
     */
    static #TestRefAttributes(attributes) {
        for (let name in attributes)
            if (name == "ref")
                return true;
        return false;
    }
}