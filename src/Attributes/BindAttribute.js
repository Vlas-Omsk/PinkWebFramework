import { NotImplementedException } from "../Exceptions.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class BindAttribute extends VirtualNodeAttribute {
    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        super(virtualNode);

        this.Update();
    }

    Update() {
        for (let attributeName in this.Element.HtmlAttributes) {
            if (attributeName.length > 1 && attributeName[0] == ':') {
                const fieldName = attributeName.slice(1);
                this.Element.Context.AddHook({
                    get: (e) => this.#OnGet(e, fieldName, this.Element.HtmlAttributes[attributeName]),
                    set: (e) => this.#OnSet(e, fieldName, this.Element.HtmlAttributes[attributeName])
                });
            }
        }
    }

    /**
     * @param {import("../VirtualNodeContext.js").HookGetEventArgs} e 
     * @param {string} targetFieldName 
     * @param {string} sourceFieldName 
     * @returns {any}
     */
    #OnGet(e, targetFieldName, sourceFieldName) {
        if (e.key == targetFieldName)
        {
            e.handled = true;
            return this.Element.Parent.Context.EvalScript(sourceFieldName);
        }
    }

    /**
     * @param {import("../VirtualNodeContext.js").HookSetEventArgs} e 
     * @param {string} targetFieldName 
     * @param {string} sourceFieldName 
     */
    #OnSet(e, targetFieldName, sourceFieldName) {
        if (e.key == targetFieldName)
        {
            throw NotImplementedException();
            e.handled = true;
            this.Element.Parent.Context[sourceFieldName] = e.value;
        }
    }
}