import ValueElement from "./ValueElement.js";
import VirtualNodeContext from "./VirtualNodeContext.js";

export default class VirtualNode {
    /** @type {HTMLElement | Node} */ HtmlElement
    /** @type {Object<string,string>} */ Attributes = {}
    /** @type {string} */ Tag
    /** @type {string} */ Value
    /** @type {VirtualNode[]} */ Elements = []
    /** @type {string} */ Html
    /** @type {VirtualNode} */ Parent
    /** @type {VirtualNodeContext} */ Context
    /** @type {boolean} */ IsComponent = false
    /** @type {boolean} */ IsTemplate = false
    /** @type {ValueElement} */ ValueElement

    /**
     * @param {HTMLElement | Node} htmlElement
     */
    constructor(htmlElement) {
        if (!htmlElement)
            return;

        this.#SetProperty(htmlElement);
        this.Context = new VirtualNodeContext(this);
        this.HtmlElement = htmlElement;
        if (htmlElement.attributes)
            Array.prototype.forEach.call(
                htmlElement.attributes,
                attribute => this.Attributes[attribute.name] = attribute.value
            );
        if (htmlElement.outerHTML)
            this.Tag = htmlElement.outerHTML
                .substr(htmlElement.outerHTML
                    .toLowerCase()
                    .indexOf(htmlElement.nodeName.toLowerCase()), htmlElement.tagName.length);
        else
            this.Tag = htmlElement.tagName && htmlElement.tagName.toLowerCase();
        this.Value = htmlElement.nodeValue;
        Array.prototype.forEach.call(htmlElement.childNodes, node => {
            const virtualNode = new VirtualNode(node);
            virtualNode.Parent = this;
            this.Elements.push(virtualNode);
        });
    }

    SetValue(value) {
        this.Value = value;
        this.HtmlElement.nodeValue = value;
    }

    SetTag(value) {
        this.Tag = value;
        this.UpdateHtml();
    }

    UpdateHtml() {
        const element = this.#CreateHtml();
        if (element)
            this.HtmlElement.after(element);
        if (this.HtmlElement)
            this.HtmlElement.remove();
        this.HtmlElement = element;
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
        if (this.IsTemplate ||
            this.Tag == "script" ||
            this.Tag == "#comment")
            return;

        let element;
        if (this.Tag == "#text") {
            if (!this.Value)
                return;
            element = document.createTextNode(this.Value);
        } else {
            element = document.createElement(this.Tag);
            if (this.Html)
                element.innerHTML = this.Html;
            else
                element.nodeValue = this.Value;
            for (let name in this.Attributes)
                element.setAttribute(name, this.Attributes[value]);
            if (updateInner && this.Elements.length > 0) {
                const innerElements = [];
                for (let element of this.Elements)
                {
                    const htmlElement = element.#CreateHtml(true);
                    if (htmlElement)
                        innerElements.push(htmlElement);
                }
                element.append(...innerElements);
            }
        }
        this.#SetProperty(element);
        return element;
    }
}