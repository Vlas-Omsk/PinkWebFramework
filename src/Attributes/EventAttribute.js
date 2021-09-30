import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class EventAttribute extends VirtualNodeAttribute {
    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        super(virtualNode);

        this.Update();
        this.Element.On("updated", this.Update);
    }

    Update() {
        for (let attributeName in this.Element.HtmlAttributes) {
            if (attributeName.length > 1 && attributeName[0] == '@')
            {
                const eventName = attributeName.slice(1);
                this.Element.HtmlElement.addEventListener(eventName, (e) => (function(script) {
                    const result = eval(script, e);
                    if (result instanceof Function)
                        result(e);
                }).call(this.Element.Context, this.Element.HtmlAttributes[attributeName], e));
            }
        }
    }
}