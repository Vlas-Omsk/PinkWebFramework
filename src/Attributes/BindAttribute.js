import GlobalObserverHandler from "../GlobalObserverHandler.js";
import VirtualNode from "../VirtualNode.js";
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
            if (attributeName == "binds" || (attributeName.length > 1 && attributeName[0] == ':')) {
                const attributeValue = this.Element.HtmlAttributes[attributeName];
                let value;
                
                this.Element.RemoveHtmlAttribute(attributeName);

                if (attributeName == "binds") {
                    value = this.Element.Parent.Context.EvalFunction(attributeValue);
                    for (let name in value)
                        this.#InitBind(name, value[name]);
                } else if (attributeName.length > 1 && attributeName[0] == ':') {
                    const bindName = attributeName.slice(1);
                    if (bindName != "style" && bindName != "class") {
                        value = () => this.Element.Parent.Context.EvalScript(attributeValue);
                    } else {
                        value = this.Element.Context.EvalFunction(attributeValue);
                    }
                    this.#InitBind(bindName, value);
                }
            }
        }
    }

    #InitBind(bindName, bindValue) {
        switch (bindName) {
            case "style":
            case "class":
                let updateFunc;

                if (bindName == "style")
                    updateFunc = this.#UpdateStyleBind.bind(this);
                else if (bindName == "class")
                    updateFunc = this.#UpdateClassBind.bind(this);

                for (let name in bindValue) {
                    const value = bindValue[name];
                    let func;
                    if (value instanceof Function) {
                        func = () => updateFunc(name, value());
                        const observers = GlobalObserverHandler.GetDependentObserver(func);
                        for (let observer of observers) {
                            observer.target.On("set", e => {
                                if (observer.keys.indexOf(e.Key) != -1)
                                    func();
                            });
                        }
                    } else {
                        func = updateFunc.bind(this, name, value);
                        func();
                    }
                    this.Element.On("updated", func);
                }
                break;
            default:
                /** @type {import("../VirtualNodeContext.js").HookHandler} */
                const hookHandler = {};
                if (bindValue instanceof Function) {
                    hookHandler.get = this.#OnGet.bind(this, bindValue.bind(this.Element.Parent.Context));
                } else if (bindValue["get"] || bindValue["set"]) {
                    if (bindValue["get"] instanceof Function)
                        hookHandler.get = this.#OnGet.bind(this, bindValue["get"].bind(this.Element.Parent.Context));
                    else if (bindValue["get"])
                        hookHandler.get = this.#OnGet.bind(this, () => bindValue["get"]);
                    
                    if (bindValue["set"] instanceof Function)
                        hookHandler.set = bindValue["set"].bind(this.Element.Parent.Context);
                } else {
                    hookHandler.get = this.#OnGet.bind(this, () => bindValue);
                }
                this.Element.Context.AddHook(bindName, hookHandler);
                break;
        }
    }

    /**
     * @param {Function} func 
     * @param {import("../VirtualNodeContext.js").HookGetEventArgs} e 
     * @returns 
     */
    #OnGet(func, e) {
        e.handled = true;
        return func(e);
    }

    /**
     * @param {string} name 
     * @param {any} value 
     */
    #UpdateClassBind(name, value) {
        if (this.Element.HtmlElement && this.Element.HtmlElement.classList) {
            const isClaasContains = this.Element.HtmlElement.classList.contains(name);
            if (value && !isClaasContains)
                this.Element.HtmlElement.classList.add(name);
            else if (!value && isClaasContains)
                this.Element.HtmlElement.classList.remove(name);
        }
    }

    /**
     * @param {string} name 
     * @param {any} value 
     */
    #UpdateStyleBind(name, value) {
        if (this.Element.HtmlElement && this.Element.HtmlElement.style) {
            if (value?.constructor == Number && name in this.Element.HtmlElement.style)
                value += "px";
            this.Element.HtmlElement.style[name] = value;
        }
    }

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static Init(virtualNode) {
        if (this.#TestBindAttributes(virtualNode.HtmlAttributes))
            new BindAttribute(virtualNode);
        return false;
    }

    /**
     * @param {Object<string,string>} attributes
     * @returns {boolean}
     */
    static #TestBindAttributes(attributes) {
        for (let name in attributes)
            if ((name.length > 1 && name[0] == ':') || name == "binds")
                return true;
        return false;
    }
}
