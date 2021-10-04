import { BindingMustReturnDifferentType, NotImplementedException } from "../Exceptions.js";
import GlobalObserverHandler from "../GlobalObserverHandler.js";
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
                if (fieldName == "style")
                    this.#UpdateStyle(this.Element.HtmlAttributes[attributeName]);
                if (fieldName == "class")
                    this.#UpdateClass(this.Element.HtmlAttributes[attributeName]);
                this.Element.Context.AddHook({
                    get: (e) => this.#OnGet(e, fieldName, this.Element.HtmlAttributes[attributeName]),
                    set: (e) => this.#OnSet(e, fieldName, this.Element.HtmlAttributes[attributeName])
                });
            }
        }
    }

    /**
     * @param {string} classScript 
     */
    #UpdateClass(classScript) {
        let classObject = this.Element.Context.EvalFunction(classScript);
        if (classObject instanceof Function)
            classObject = classObject.call(this.Element.Context);
        if (!(classObject instanceof Object))
            throw new BindingMustReturnDifferentType("Object<string, (Function | string)>");
        
        for (let className in classObject) {
            const anonymousUpdateClassProperty = this.#UpdateClassProperty.bind(this, className, classObject[className]);
            this.Element.On("updated", anonymousUpdateClassProperty);
            const observers = GlobalObserverHandler.GetDependentObserver(anonymousUpdateClassProperty);
            for (let observer of observers) {
                observer.target.On("set", e => {
                    if (observer.keys.indexOf(e.Key) != -1)
                        anonymousUpdateClassProperty();
                });
            }
        }
    }

    /**
     * @param {string} name 
     * @param {Function | string} value 
     */
    #UpdateClassProperty(name, value) {
        if (value instanceof Function)
            value = value.call(this.Element.Context);
        if (this.Element.HtmlElement) {
            const isClaasContains = this.Element.HtmlElement.classList.contains(name);
            if (value && !isClaasContains)
                this.Element.HtmlElement.classList.add(name);
            else if (!value && isClaasContains)
                this.Element.HtmlElement.classList.remove(name);
        }
    }

    /**
     * @param {string} styleScript 
     */
    #UpdateStyle(styleScript) {
        let styleObject = this.Element.Context.EvalFunction(styleScript);
        if (styleObject instanceof Function)
            styleObject = styleObject.call(this.Element.Context);
        if (!(styleObject instanceof Object))
            throw new BindingMustReturnDifferentType("Object<string, (Function | string)>");

        for (let styleName in styleObject) {
            const anonymousUpdateStyleProperty = this.#UpdateStyleProperty.bind(this, styleName, styleObject[styleName]);
            this.Element.On("updated", anonymousUpdateStyleProperty);
            const observers = GlobalObserverHandler.GetDependentObserver(anonymousUpdateStyleProperty);
            for (let observer of observers) {
                observer.target.On("set", e => {
                    if (observer.keys.indexOf(e.Key) != -1)
                        anonymousUpdateStyleProperty();
                });
            }
        }
    }

    /**
     * @param {string} name 
     * @param {Function | string} value 
     */
    #UpdateStyleProperty(name, value) {
        if (value instanceof Function)
            value = value.call(this.Element.Context);
        if (this.Element.HtmlElement) {
            if (value.constructor == Number && name in this.Element.HtmlElement.style)
                value = value + "px";
            this.Element.HtmlElement.style[name] = value;
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