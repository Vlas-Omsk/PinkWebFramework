import GlobalObserverHandler from "../GlobalObserverHandler.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class IfAttribute extends VirtualNodeAttribute {
    constructor(virtualNode) {
        super(virtualNode);

        this.Update();
    }

    Update() {
        for (let attributeName in this.Element.HtmlAttributes) {
            if (attributeName == "if") {
                const attributeValue = this.Element.HtmlAttributes[attributeName];
                const func = () => this.Element.Context.EvalScript(attributeValue);
                const observers = GlobalObserverHandler.GetDependentObserver(func);
                
                for (let observer of observers) {
                    observer.target.On("set", e => {
                        if (observer.keys.indexOf(e.Key) != -1)
                        this.#UpdateVisible(func);
                    });
                }
                this.#UpdateVisible(func);
                this.Element.RemoveHtmlAttribute(attributeName);

                return;
            }
        }
    }

    #UpdateVisible(func) {
        this.Element.IsVisible = func() ? true : false;
    }

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static Init(virtualNode) {
        if (this.#TestIfAttributes(virtualNode.HtmlAttributes))
            new IfAttribute(virtualNode);
        return false;
    }

    /**
     * @param {Object<string,string>} attributes
     * @returns {boolean}
     */
    static #TestIfAttributes(attributes) {
        for (let name in attributes)
            if (name == "if")
                return true;
        return false;
    }
}