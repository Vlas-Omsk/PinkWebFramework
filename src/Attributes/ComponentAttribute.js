import { ComponentCanOnlyContainOneElement, ComponentRequiresSrcAttribute } from "../Exceptions.js";
import VirtualNode from "../VirtualNode.js";
import VirtualNodeContext from "../VirtualNodeContext.js";
import AttributesInitializer from "./AttributesInitializer.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class ComponentAttribute extends VirtualNodeAttribute {
    /** @type {string} */ #source
    /** @type {string} */ #script
    /** @type {VirtualNode} */ #dynamicElement = [];
    
    get DynamicElement() {
        return this.#dynamicElement;
    }

    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        super(virtualNode);

        virtualNode.MakeTemplate();

        this.#source = virtualNode.HtmlAttributes["src"];
        if (!this.#source)
            throw new ComponentRequiresSrcAttribute();
        virtualNode.RemoveHtmlAttribute("src");
        
        this.Update();
    }

    async Update() {
        window.Framework.AsyncTaskBegin(this);

        const childrens = (await this.#TryGetHtmlContent()).children;

        for (let children of childrens)
            if (children.tagName == "SCRIPT")
                this.#script = children.textContent;

        for (let children of childrens) {
            if (children.tagName == "COMPONENT") {
                if (children.children.length > 1)
                    throw new ComponentCanOnlyContainOneElement();
                this.#dynamicElement = new VirtualNode(children.children[0]);
                this.#dynamicElement.MakeDynamic(this.Element);
                this.#dynamicElement.MakeComponent();
                for (let attributeName in this.Element.HtmlAttributes)
                    this.#dynamicElement.SetHtmlAttribute(attributeName, this.Element.HtmlAttributes[attributeName]);
                const templateIndex = this.Element.Parent.Elements.indexOf(this.Element);
                this.Element.Parent.InsertNode(templateIndex, this.#dynamicElement);
                if (!AttributesInitializer.TryInitForAttribute(this.#dynamicElement))
                {
                    this.EvalScript(this.#dynamicElement.Context);
                    AttributesInitializer.InitAttributes(this.#dynamicElement);
                }
            } else if (children.tagName == "STYLE") {
                document.head.appendChild(children);
            }
        }

        window.Framework.AsyncTaskEnd(this);
    }

    /**
     * @param {VirtualNodeContext} context 
     */
    EvalScript(context) {
        context.EvalScript(this.#script);
    }

    /**
     * @returns {Promise<HTMLBodyElement>}
     */
    async #TryGetHtmlContent() {
        const response = await (await fetch(this.#source)).text();
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(response, 'text/html');
        return htmlDoc.body;
    }
}