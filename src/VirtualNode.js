import VirtualNodeAttribute from "./Attributes/VirtualNodeAttribute.js";
import { IndexOutOfRangeException } from "./Exceptions.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import VirtualNodeContext from "./VirtualNodeContext.js";
import VirtualNodeEventArgs from "./VirtualNodeEventArgs.js";

export default class VirtualNode {
    /** @type {VirtualNode[]} */ Elements = []

    /** @type {HTMLElement | Node} */ #htmlElement
    /** @type {VirtualNode} */ #parent
    /** @type {VirtualNode} */ #templatedParent
    /** @type {VirtualNodeContext} */ #context
    /** @type {VirtualNodeAttribute[]} */ #attributes = []
    /** @type {string} */ #tag
    /** @type {string} */ #value
    /** @type {Object<string,string>} */ #htmlAttributes = {}
    /** @type {string} */ #html
    /** @type {?string} */ #slotName = null
    /** @type {?string} */ #refName = null
    /** @type {boolean} */ #isTemplate = false
    /** @type {boolean} */ #isDynamic = false
    /** @type {boolean} */ #isComponent = false
    /** @type {FrameworkEventTarget<VirtualNodeEventArgs>} */ #eventTarget = new FrameworkEventTarget()
    /** @type {string[]} */ #registeredEvents = []

    get HtmlElement() {
        return this.#htmlElement;
    }

    get Parent() {
        return this.#parent;
    }

    get TemplatedParent() {
        return this.#templatedParent;
    }

    get Context() {
        return this.#context;
    }

    get Attributes() {
        return Object.freeze(this.#attributes);
    }

    get Tag() {
        return this.#tag;
    }
    set Tag(value) {
        if (this.#tag == value)
            return;
        this.#tag = value;
        this.UpdateHtml();
    }

    get Value() {
        return this.#value;
    }
    set Value(value) {
        if (this.#value == value)
            return;
        this.#value = value;
        if (this.#htmlElement)
            this.#htmlElement.nodeValue = value;
    }

    get HtmlAttributes() {
        return this.#htmlAttributes;
    }

    get Html() {
        return this.#html;
    }
    set Html(value) {
        this.#html = value;
        this.UpdateHtml();
    }

    get SlotName() {
        return this.#slotName;
    }
    set SlotName(value) {
        this.#slotName = value;
    }

    get RefName() {
        return this.#refName;
    }
    set RefName(value) {
        this.#refName = value;
    }

    get IsTemplate() {
        return this.#isTemplate;
    }

    get IsDynamic() {
        return this.#isDynamic;
    }

    get IsComponent() {
        return this.#isComponent;
    }

    /**
     * @param {HTMLElement | Node} htmlElement
     */
    constructor(htmlElement) {
        if (!htmlElement)
            return;

        this.#SetProperty(htmlElement);
        this.#context = new VirtualNodeContext(this);
        this.#htmlElement = htmlElement;
        if (htmlElement.attributes) {
            for (let i = 0; i < htmlElement.attributes.length; i++) {
                let attribute = htmlElement.attributes[i];
                this.#htmlAttributes[attribute.name] = attribute.value;
                if (!this.#IsAvailableAttribute(attribute.name)) {
                    htmlElement.removeAttribute(attribute.name);
                    i--;
                }
            }
        }
        if (htmlElement.outerHTML)
            this.#tag = htmlElement.outerHTML
                .substr(htmlElement.outerHTML
                    .toLowerCase()
                    .indexOf(htmlElement.nodeName.toLowerCase()), htmlElement.tagName.length);
        else
            this.#tag = htmlElement.nodeName && htmlElement.nodeName.toLowerCase();
        this.#value = htmlElement.nodeValue;
        Array.prototype.forEach.call(htmlElement.childNodes, node => {
            const virtualNode = new VirtualNode(node);
            virtualNode.#parent = this;
            this.Elements.push(virtualNode);
        });

        this.#OnCreated();
    }

    /**
     * @param {VirtualNodeAttribute} virtualNodeAttribute 
     */
    AddAttribute(virtualNodeAttribute) {
        this.#attributes.push(virtualNodeAttribute);
    }

    /**
     * @param {any} attributeObject 
     */
    GetAttribute(attributeObject) {
        for (let attribute of this.#attributes)
            if (attribute instanceof attributeObject)
                return attribute;
        return null;
    }

    /**
     * @param {string} name
     * @param {string} value
     */
    SetHtmlAttribute(name, value) {
        if (this.#htmlAttributes[name] == value)
            return;
        this.#htmlAttributes[name] = value;
        if (this.#htmlElement && this.#htmlElement.setAttribute && this.#IsAvailableAttribute(name))
            this.#htmlElement.setAttribute(name, value);
    }

    /**
     * @param {string} name
     */
    RemoveHtmlAttribute(name) {
        delete this.#htmlAttributes[name];
        if (this.#htmlElement && this.#htmlElement.removeAttribute)
            this.#htmlElement.removeAttribute(name);
    }

    /**
     * @param {string} slotName 
     * @returns 
     */
    MakeSlot(slotName) {
        if (this.#slotName)
            return;
        this.#slotName = slotName;
    }

    MakeTemplate() {
        if (this.#isTemplate)
            return;
        this.#isTemplate = true;
        this.UpdateHtml();
    }

    /**
     * @param {VirtualNode} templatedParent 
     */
    MakeDynamic(templatedParent) {
        if (this.#isDynamic)
            return;
        this.#templatedParent = templatedParent;
        this.#isDynamic = true;
    }

    MakeComponent() {
        if (this.#isComponent)
            return;
        this.#isComponent = true;
    }

    /**
     * @param {string} slotName 
     */
    GetSlot(slotName) {
        return this.FindNode(element => element.SlotName == slotName);
    }

    /**
     * @param {string} refName 
     */
    GetRefs(refName) {
        const elements = [];
        for (let element of this.Elements) {
            if (element.RefName == refName)
                elements.push(element);
            if (!element.IsComponent)
                elements.push(...element.GetRefs(refName));
        }
        return elements;
    }

    /** 
     * @param {(element: VirtualNode) => boolean} predicate
     * @param {boolean} deep
     * @returns {VirtualNode}
     */
    FindNode(predicate, deep = true) {
        for (let element of this.Elements) {
            if (predicate(element))
                return element;
            if (deep && !element.IsComponent) {
                const node = element.FindNode(predicate);
                if (node)
                    return node;
            }
        }
        return null;
    }

    /** 
     * @param {?(element: VirtualNode) => boolean} predicate
     * @param {boolean} deep
     * @returns {VirtualNode[]}
     */
    FilterNodes(predicate, deep = true) {
        const elements = [];
        for (let element of this.Elements) {
            if (!predicate || predicate(element))
                elements.push(element);
            if (deep)
                elements.push(...element.FilterNodes(predicate));
        }
        return elements;
    }

    /**
     * @param {number} index
     * @param {VirtualNode} virtualNode
     */
    ReplaceNode(index, virtualNode) {
        if (index < 0 || index >= this.Elements.length)
            throw new IndexOutOfRangeException("index");

        const element = this.Elements[index];

        element.Elements = virtualNode.Elements;
        element.#html = virtualNode.#html;
        element.#parent = this;
        element.#context = virtualNode.#context;
        element.#tag = virtualNode.#tag;
        element.#value = virtualNode.#value;
        element.#htmlAttributes = virtualNode.#htmlAttributes;
        element.#slotName = virtualNode.#slotName;
        element.#refName = virtualNode.#refName;
        element.#isComponent = virtualNode.#isComponent;

        element.UpdateHtml();
    }

    /**
     * @param {number} index
     * @param {VirtualNode} virtualNode
     */
    InsertNode(index, virtualNode) {
        if (index < 0 || index >= this.Elements.length)
            throw new IndexOutOfRangeException("index");

        const element = document.createComment("");
        this.Elements[index].#htmlElement.after(element);
        virtualNode.#parent = this;
        virtualNode.#htmlElement = element;
        Array.insert(this.Elements, index + 1, virtualNode);

        virtualNode.#OnCreated();
        virtualNode.UpdateHtml();
    }

    /**
     * @param {number} index
     */
    RemoveNode(index) {
        if (index < 0 || index >= this.Elements.length)
            throw new IndexOutOfRangeException("index");
        
        const element = this.Elements[index];
        if (element.HtmlElement)
            element.HtmlElement.remove();
        Array.removeAt(this.Elements, index);

        element.#OnDestroyed();
    }

    /**
     * @returns {VirtualNode}
     */
    Clone() {
        return this.#CloneInner(null);
    }

    UpdateHtml() {
        const element = this.#CreateHtml(true);
        if (element)
            this.#htmlElement.after(element);
        if (this.#htmlElement)
            this.#htmlElement.remove();
        this.#htmlElement = element;

        this.#OnUpdated();
    }

    /**
     * @param {string} type 
     * @param {any} data 
     */
    Emit(type, data) {
        this.#Dispatch(type, data);
        if (!this.#isComponent && this.#parent)
            this.#parent.Emit(type, data);
    }

    /**
     * @param {string} name
     * @param {import("./FrameworkEventTarget").EventHandler<VirtualNodeEventArgs>} callback
     */
    On(name, callback) {
        const systemEventName = "on" + name;
        if ((systemEventName in HTMLElement.prototype || systemEventName in Node.prototype) &&
            this.#registeredEvents.indexOf(name) == -1) {
            this.#registeredEvents.push(name);
            if (this.#htmlElement)
                this.#htmlElement.addEventListener(name, e =>
                    this.#Dispatch(name, e));
        }
        this.#eventTarget.On(name, callback);
    }

    /**
     * @param {string} name
     * @param {import("./FrameworkEventTarget").EventHandler<VirtualNodeEventArgs>} callback
     */
    Off(name, callback) {
        this.#eventTarget.Off(name, callback);
    }

    /**
     * @param {string} type 
     * @param {any} data 
     */
    #Dispatch(type, data) {
        this.#eventTarget.Dispatch(new VirtualNodeEventArgs(data, type, this));
    }

    #OnCreated() {
        this.#Dispatch("created", null);
    }

    #OnUpdated() {
        this.#Dispatch("updated", null);
    }

    #OnDestroyed() {
        this.#Dispatch("destroyed", null);
    }

    /**
     * @param {VirtualNode} parentNode
     * @returns {VirtualNode}
     */
    #CloneInner(parentNode) {
        const element = new VirtualNode();
        for (let virtualNode of this.Elements)
            element.Elements.push(virtualNode.#CloneInner(element));
        element.#html = this.#html;
        element.#parent = parentNode;
        element.#context = new VirtualNodeContext(element);
        element.#tag = this.#tag;
        element.#value = this.#value;
        element.#htmlAttributes = Object.assign({}, this.#htmlAttributes);
        element.#slotName = this.#slotName;
        element.#refName = this.#refName;
        element.#isComponent = this.#isComponent;
        return element;
    }

    /**
     * @param {HTMLElement | Node} htmlElement 
     */
    #SetProperty(htmlElement) {
        htmlElement["VirtualNode"] = this;
    }

    /**
     * @param {boolean} updateInner
     * @returns {HTMLElement | Node | undefined}
     */
    #CreateHtml(updateInner) {
        if (this.#tag == "script" ||
            this.#tag == "#comment")
            return;

        let element;
        if (this.#isTemplate) {
            element = document.createComment("");
        } else if (this.#tag == "#text") {
            if (!this.#value)
                return;
            element = document.createTextNode(this.#value);
        } else {
            element = document.createElement(this.#tag);
            if (this.#html)
                element.innerHTML = this.#html;
            else
                element.nodeValue = this.#value;
            for (let name in this.#htmlAttributes) {
                if (this.#IsAvailableAttribute(name)) {
                    element.setAttribute(name, this.#htmlAttributes[name]);
                }
            }
            const innerElements = [];
            for (let element of this.Elements)
            {
                if (updateInner)
                    element.#htmlElement = element.#CreateHtml(true);
                if (element.#htmlElement)
                    innerElements.push(element.#htmlElement);
            }
            element.append(...innerElements);
        }
        for (let type of this.#registeredEvents)
            element.addEventListener(type, e =>
                this.#Dispatch(type, e));
        this.#SetProperty(element);
        return element;
    }

    /**
     * @param {string} attributeName 
     */
    #IsAvailableAttribute(attributeName) {
        return attributeName.length == 0 || (attributeName[0] != '@' && attributeName[0] != ':');
    }
}