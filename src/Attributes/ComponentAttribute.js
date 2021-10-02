import { ComponentCanOnlyContainOneElement, ComponentRequiresSlot, ComponentRequiresSrcAttribute, SlotCanOnlyContainOneElement, SlotRequiresNameAttribute } from "../Exceptions.js";
import VirtualNode from "../VirtualNode.js";
import VirtualNodeContext from "../VirtualNodeContext.js";
import AttributesInitializer from "./AttributesInitializer.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class ComponentAttribute extends VirtualNodeAttribute {
    /** @type {string} */ #source
    /** @type {string} */ #script
    /** @type {VirtualNode} */ #dynamicElement
    
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
            if (children.tagName == "SCRIPT") {
                this.#script = children.textContent;
                break;
            }

        for (let children of childrens) {
            if (children.tagName == "COMPONENT") {
                if (children.children.length > 1)
                    throw new ComponentCanOnlyContainOneElement();
                this.#dynamicElement = this.#CreateElement(children.children[0]);
                if (!AttributesInitializer.TryInitForAttribute(this.#dynamicElement))
                {
                    this.EvalScript(element.Context);
                    AttributesInitializer.InitAttributes(element);
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
     * @param {HTMLElement} componentElement
     * @returns {VirtualNode}
     */
    #CreateElement(componentElement) {
        const element = new VirtualNode(componentElement);
        element.MakeDynamic(this.Element);
        element.MakeComponent();
        this.#InsertSlots(element);
        for (let attributeName in this.Element.HtmlAttributes)
            element.SetHtmlAttribute(attributeName, this.Element.HtmlAttributes[attributeName]);
        const templateIndex = this.Element.Parent.Elements.indexOf(this.Element);
        this.Element.Parent.InsertNode(templateIndex, element);
        return element;
    }

    /**
     * @param {VirtualNode} virtualNode 
     */
    #InsertSlots(virtualNode) {
        const templateSlots = virtualNode.SelectNodes(element => element.Tag == "slot");
        const slots = this.Element.SelectNodes(element => element.Tag == "slot", false);
        let haveDefaultSlot = false;
        for (let templateSlot of templateSlots) {
            const templateSlotIdx = templateSlot.Parent.Elements.indexOf(templateSlot);
            if (!templateSlot.HtmlAttributes["name"] && haveDefaultSlot)
                throw new SlotRequiresNameAttribute();
            let slotName = templateSlot.HtmlAttributes["name"];
            const slot = slots.find(element =>
                slotName ? element.HtmlAttributes["name"] == slotName : !element.HtmlAttributes["name"]);
            if (!slotName)
                slotName = "default";
            if (!slot) {
                if (!templateSlot.HtmlAttributes["required"]) {
                    templateSlot.Parent.RemoveNode(templateSlotIdx);
                    continue;
                } else {
                    throw new ComponentRequiresSlot(slotName);
                }
            }
            if (!slot.HtmlAttributes["name"]) {
                if (!haveDefaultSlot)
                    haveDefaultSlot = true;
                else
                    throw new SlotRequiresNameAttribute();
            }
            if (slot.HtmlElement.children.length > 1)
                throw new SlotCanOnlyContainOneElement();
            templateSlot.Parent.ReplaceNode(templateSlotIdx, slot.HtmlElement.children[0].VirtualNode);
            templateSlot.Parent.Elements[templateSlotIdx].MakeSlot(slotName);
        }
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