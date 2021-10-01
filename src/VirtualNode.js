import VirtualNodeAttribute from "./Attributes/VirtualNodeAttribute.js";
import { IndexOutOfRangeException } from "./Exceptions.js";
import VirtualNodeContext from "./VirtualNodeContext.js";

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
    /** @type {boolean} */ #isTemplate = false
    /** @type {boolean} */ #isDynamic = false
    /** @type {boolean} */ #isComponent = false
    /** @type {EventTarget} */ #eventTarget = new EventTarget()

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
        if (htmlElement.attributes)
            Array.prototype.forEach.call(
                htmlElement.attributes,
                attribute => this.#htmlAttributes[attribute.name] = attribute.value
            );
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
        if (this.#htmlElement.setAttribute)
            this.#htmlElement.setAttribute(name, value);
    }

    /**
     * @param {string} name
     */
    RemoveHtmlAttribute(name) {
        delete this.#htmlAttributes[name];
        if (this.#htmlElement.removeAttribute)
            this.#htmlElement.removeAttribute(name);
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

    MakeTemplate() {
        if (this.#isTemplate)
            return;
        this.#isTemplate = true;
        this.UpdateHtml();
    }

    MakeComponent() {
        if (this.#isComponent)
            return;
        this.#isComponent = true;
    }

    /**
     * @param {number} index
     * @param {VirtualNode} virtualNode
     */
    InsertNode(index, virtualNode) {
        if (index < 0 || index >= this.Elements.length)
            throw IndexOutOfRangeException("index");

        const element = virtualNode.#CreateHtml(true);
        if (element)
            this.Elements[index].#htmlElement.after(element);
        virtualNode.#parent = this;
        virtualNode.#htmlElement = element;
        Array.insert(this.Elements, index + 1, virtualNode);
    }

    /**
     * @param {number} index
     */
    RemoveNode(index) {
        if (index < 0 || index >= this.Elements.length)
            throw IndexOutOfRangeException("index");
        
        const element = this.Elements[index];
        if (element.HtmlElement)
            element.HtmlElement.remove();
        Array.removeAt(this.Elements, index);
    }

    /**
     * @returns {VirtualNode}
     */
    Clone() {
        return this.#CloneInner(this.#parent);
    }

    UpdateHtml() {
        const element = this.#CreateHtml();
        if (element)
            this.#htmlElement.after(element);
        if (this.#htmlElement)
            this.#htmlElement.remove();
        this.#htmlElement = element;
        this.#eventTarget.dispatchEvent(new CustomEvent("updated"));
    }

    /**
     * @param {string} type 
     * @param {CustomEventInit<any>} eventInitDict 
     */
    Emit(type, eventInitDict) {
        this.#htmlElement.dispatchEvent(new CustomEvent(type, eventInitDict));
    }

    /**
     * @param {string} name
     * @param {EventListenerOrEventListenerObject} callback
     */
    On(name, callback) {
        this.#eventTarget.addEventListener(name, callback);
    }

    /**
     * @param {string} name
     * @param {EventListenerOrEventListenerObject} callback
     */
    Off(name, callback) {
        this.#eventTarget.removeEventListener(name, callback);
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
            if (updateInner && this.Elements.length > 0) {
                const innerElements = [];
                for (let element of this.Elements)
                {
                    element.#htmlElement = element.#CreateHtml(true);
                    if (element.#htmlElement)
                        innerElements.push(element.#htmlElement);
                }
                element.append(...innerElements);
            }
        }
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