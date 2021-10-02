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
}