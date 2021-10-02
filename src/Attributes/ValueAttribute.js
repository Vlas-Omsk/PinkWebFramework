import GlobalObserverHandler from "../GlobalObserverHandler.js";
import VirtualNode from "../VirtualNode.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export const testRegex = /{{(.*?)}}/;
export const testRegexGlobal = /{{(.*?)}}/g;

export default class ValueAttribute extends VirtualNodeAttribute {
    /** @type {string} */ #templateValue
    /** @type {string} */ #templateTag
    /** @type {Object<string,string>} */ #templateAttributes = {}

    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        super(virtualNode);
        
        if (testRegex.test(virtualNode.Value))
            this.#templateValue = virtualNode.Value;
        if (testRegex.test(virtualNode.Tag))
            this.#templateTag = virtualNode.Tag;
        for (let name in virtualNode.HtmlAttributes)
        {
            const value = virtualNode.HtmlAttributes[name];
            if (testRegex.test(value))
                this.#templateAttributes[name] = value;
        }

        const observers = GlobalObserverHandler.GetDependentObserver(this.Update.bind(this));
        for (let observer of observers) {
            observer.target.On("set", e => {
                if (observer.keys.indexOf(e.Key) != -1)
                    this.Update();
            });
        }
    }

    Update() {
        if (this.#templateValue)
            this.Element.Value = this.#Eval(this.#templateValue);
        if (this.#templateTag)
            this.Element.Tag = this.#Eval(this.#templateTag);
        for (let name in this.#templateAttributes)
            this.Element.SetHtmlAttribute(name, this.#Eval(this.#templateAttributes[name]));
    }

    /**
     * @param {string} value
     * @returns {string}
     */
    #Eval(value) {
        return value.replaceAll(testRegexGlobal, (_, e) => {
            try {
                return this.Element.Context.EvalScript(e);
            } catch(ex) {
                return ex;
            }
        });
    }
}