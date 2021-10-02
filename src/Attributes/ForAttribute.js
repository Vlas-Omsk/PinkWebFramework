import { IndexOutOfRangeException } from "../Exceptions.js";
import ValueChangedEventArgs from "../ValueChangedEventArgs.js";
import VirtualNode from "../VirtualNode.js";
import AttributesInitializer from "./AttributesInitializer.js";
import ComponentAttribute from "./ComponentAttribute.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class ForAttribute extends VirtualNodeAttribute {
    /** @type {string} */ #targetName
    /** @type {?number} */ #targetValue = null;
    /** @type {ForType} */ #type
    /** @type {string} */ #sourceName
    /** @type {VirtualNode[]} */ #dynamicElements = [];
    
    get DynamicElements() {
        return this.#dynamicElements;
    }

    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        super(virtualNode);

        virtualNode.MakeTemplate();

        const forAttribute = virtualNode.HtmlAttributes["for"];
        virtualNode.RemoveHtmlAttribute("for");
        if (forAttribute.includes(';'))
            this.#ParseCycle(forAttribute);
        else if (forAttribute.includes(' in ') || forAttribute.includes(' of '))
            this.#ParseEachCycle(forAttribute);

        if (this.#type != ForType.Cycle) {
            const source = this.Element.Context.EvalScript(this.#sourceName);
            if (source.IObservable) {
                source.On("set", this.#EventHandler.bind(this));
                source.On("add", this.#EventHandler.bind(this));
                source.On("remove", this.#EventHandler.bind(this));
            }
        }

        this.Update();
    }

    /**
     * @param {ValueChangedEventArgs} e
     */
    #EventHandler(e) {
        let innerIdx = 0;
        for (let el in e.Object)
        {
            if (e.Key == el)
                break;
            innerIdx++;
        }
        const value = this.#type == ForType.In ? e.Key : e.Value;
        switch (e.Type) {
            case "set":
                this.#RemoveElement(innerIdx);
                this.#CreateElement(innerIdx, this.#targetName, value);
                break;
            case "add":
                this.#CreateElement(innerIdx, this.#targetName, value);
                break;
            case "remove":
                this.#RemoveElement(innerIdx);
                break;
        }
    }

    /**
     * @param {string} forAttribute 
     */
    #ParseCycle(forAttribute) {
        const initializer = forAttribute.substr(0, forAttribute.indexOf(';')).trim();
        if (String.isNullOrEmpty(initializer))
            throw Error("'for' must describe an initializer");
        this.#type = ForType.Cycle;
        let targetStartPos = 0;
        if (initializer.startsWith('var') || initializer.startsWith('let'))
            targetStartPos += 3;
        let targetEndPos = initializer.length;
        const equalsPos = initializer.indexOf('=');
        if (equalsPos != -1)
        {
            targetEndPos = equalsPos;
            this.#targetValue = Number(initializer.substr(equalsPos + 1));
        }
        this.#targetName = initializer.substring(targetStartPos, targetEndPos).trim();
        this.#sourceName = forAttribute.substr(forAttribute.indexOf(';') + 1).trim();
    }

    /**
     * @param {string} forAttribute 
     */
    #ParseEachCycle(forAttribute) {
        let wordPos;
        let startPos = 0;
        if (forAttribute.startsWith('var') || forAttribute.startsWith('let'))
            startPos += 3;
        if (forAttribute.includes(' in ')) {
            wordPos = forAttribute.indexOf(' in ');
            this.#type = ForType.In;
        } else {
            wordPos = forAttribute.indexOf(' of ');
            this.#type = ForType.Of;
        }
        this.#targetName = forAttribute.substring(startPos, wordPos).trim();
        this.#sourceName = forAttribute.substr(wordPos + 4).trim();
    }

    Update() {
        this.#ClearElements();
        eval(`
            for (${this.#GetForFunction()}) {
                const index = this.#dynamicElements.length;
                this.#CreateElement(index, "${this.#targetName}", ${this.#targetName});
            }
        `);
    }

    /**
     * @param {VirtualNode} rootElement 
     * @param {VirtualNode} currentElement 
     */
    #RecursiveSetSlots(rootElement, currentElement) {
        for (let element of currentElement.Elements) {
            if (element.SlotName)
                rootElement.Slots[element.SlotName] = element;
            else if (!element.IsComponent)
                this.#RecursiveSetSlots(rootElement, element);
        }
    }

    /**
     * @param {string} name 
     * @param {any} value 
     */
    #CreateElement(index, name, value) {
        const element = this.Element.Clone();
        element.Context[name] = value;
        this.#InsertElement(index, element);
        if (element.IsComponent) {
            this.#RecursiveSetSlots(element, element);
            this.Element.TemplatedParent.GetAttribute(ComponentAttribute).EvalScript(element.Context);
        }
        AttributesInitializer.InitAttributes(element);
    }

    /**
     * @param {number} index 
     */
    #RemoveElement(index) {
        if (index > this.#dynamicElements.length || index < 0)
            throw new IndexOutOfRangeException("index");

        this.Element.Parent.RemoveNode(this.Element.Parent.Elements.indexOf(this.#dynamicElements[index]));
        Array.removeAt(this.#dynamicElements, index);
    }

    /**
     * @param {number} index 
     * @param {VirtualNode} virtualNode
     */
    #InsertElement(index, virtualNode) {
        if (index > this.#dynamicElements.length || index < 0)
            throw new IndexOutOfRangeException("index");

        virtualNode.MakeDynamic(this.Element);
        Array.insert(this.#dynamicElements, index, virtualNode);
        const templateIndex = this.Element.Parent.Elements.indexOf(this.Element);
        index += templateIndex;
        this.Element.Parent.InsertNode(index, virtualNode);
    }

    #ClearElements() {
        for (let element of this.#dynamicElements)
            this.Element.Parent.RemoveNode(this.Element.Parent.Elements.indexOf(element));
    }

    /**
     * @returns {string}
     */
    #GetForFunction() {
        let result = "let " + this.#targetName;
        if (this.#type == ForType.Cycle) {
            if (this.#targetValue == null)
            {
                const value = this.Element.Context[this.#targetName];
                if (value)
                    result += " = " + value;
                else
                    result += " = 0";
            } else
                result += " = " + this.#targetValue;
            result += "; ";
        }
        if (this.#type == ForType.In)
            result += " in ";
        if (this.#type == ForType.Of)
            result += " of ";
        result += this.#sourceName;
        return result;
    }
}

/**
 * @readonly
 * @enum {number}
 */
const ForType = Object.freeze({
    In: 0,
    Of: 1,
    Cycle: 2
});