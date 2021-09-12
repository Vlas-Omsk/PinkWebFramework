import GlobalObserverHandler from "./GlobalObserverHandler.js";
import VirtualNode from "./VirtualNode.js";

const testRegex = /{{(.*?)}}/;

export default class ValueElement {
    /** @type {VirtualNode} */ Element

    /** @type {string} */ #templateValue
    /** @type {string} */ #templateTag
    /** @type {Object<string,string>} */ #templateAttributes

    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        this.Element = virtualNode;
        if (testRegex.test(virtualNode.Value))
            this.#templateValue = virtualNode.Value;
        if (testRegex.test(virtualNode.Tag))
            this.#templateTag = virtualNode.Tag;
        this.#templateAttributes = [];
        for (let name in virtualNode.Attributes)
        {
            const value = virtualNode.Attributes[name];
            if (testRegex.test(value))
                this.#templateAttributes[name] = value;
        }

        const observers = GlobalObserverHandler.GetDependentObserver(this.#Update.bind(this));
        for (let observer of observers) {
            observer.target.On("set", e => {
                if (observer.keys.indexOf(e.key) != -1)
                    this.#Update();
            });
        }
    }

    #Update() {
        if (this.#templateValue)
            this.Element.SetValue(this.#Eval(this.#templateValue));
        if (this.#templateTag)
            this.Element.SetTag(this.#Eval(this.#templateTag));
    }

    /**
     * @param {string} value
     * @returns {string}
     */
    #Eval(value) {
        return value.replace(testRegex, function(_, e) {
            try {
                return eval(e);
            } catch(ex) {
                return ex;
            }
        }.bind(this.Element.Context));
    }

    /**
     * @param {VirtualNode} virtualNode
     */
    static InitElements(virtualNode) {
        for (let element of virtualNode.Elements) {
            if (testRegex.test(element.Value) ||
                testRegex.test(element.Tag) ||
                this.#TestAttributes(element.Attributes))
                element.ValueElement = new ValueElement(element);
            this.InitElements(element);
        }
    }

    static #TestAttributes(attributes) {
        for (let name in attributes)
            if (testRegex.test(attributes[name]))
                return true;
        return false;
    }
}