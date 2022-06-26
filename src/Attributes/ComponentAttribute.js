import { 
    ComponentCanOnlyContainOneElementException,
    ComponentRequiresSlotException,
    ComponentRequiresSrcAttributeException,
    LangNotLoadedException,
    SlotCanOnlyContainOneElementException,
    SlotRequiresNameAttributeException,
    UnknownLangException
} from "../Exceptions.js";
import VirtualNode from "../VirtualNode.js";
import AttributesInitializer from "./AttributesInitializer.js";
import ForAttribute from "./ForAttribute.js";
import VirtualNodeAttribute from "./VirtualNodeAttribute.js";

export default class ComponentAttribute extends VirtualNodeAttribute {
    /** @type {number[]} */ static #existingStyleHashes = []
    /** @type {boolean} */ static #isSassConfigured = false

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
            throw new ComponentRequiresSrcAttributeException();
        virtualNode.RemoveHtmlAttribute("src");
        
        this.Update();
    }

    async Update() {
        window.Framework.AsyncTaskBegin(this);

        const childrens = (await this.#TryGetHtmlContent()).children;

        for (let children of childrens)
            if (children.tagName == "STYLE")
                await this.#LoadStyle(children);
        for (let children of childrens)
            if (children.tagName == "SCRIPT") {
                this.#script = children.textContent;
                break;
            }
        for (let children of childrens)
            if (children.tagName == "COMPONENT") {
                if (children.children.length > 1)
                    throw new ComponentCanOnlyContainOneElementException();
                this.#dynamicElement = this.#CreateElement(children.children[0]);
                if (!ForAttribute.Init(this.#dynamicElement))
                {
                    this.EvalScript(this.#dynamicElement);
                    AttributesInitializer.InitAttributes(this.#dynamicElement);
                    this.#dynamicElement.UpdateHtml();
                }
            }

        window.Framework.AsyncTaskEnd(this);
    }

    /**
     * @param {VirtualNode} element 
     */
    EvalScript(element) {
        element.Context.EvalScript(this.#script);
        for (let propName in element.Context)
            if (/^\$/i.test(propName))
                element.On(propName.slice(1).toLocaleLowerCase(),
                    (e) => element.Context[propName].call(element.Context, e));
    }

    /**
     * 
     * @param {HTMLStyleElement} element 
     */
    async #LoadStyle(element) {
        const hash = String.hashCode(element.innerHTML);

        if (ComponentAttribute.#existingStyleHashes.indexOf(hash) == -1) {
            ComponentAttribute.#existingStyleHashes.push(hash);

            const langAttribute = element.getAttribute("lang");
            element.removeAttribute("lang");
            if (langAttribute) {
                switch (langAttribute) {
                    case "scss":
                    case "sass":
                        if (!window["Sass"])
                            throw new LangNotLoadedException(langAttribute, "https://github.com/medialize/sass.js");
                        if (!ComponentAttribute.#isSassConfigured) {
                            ComponentAttribute.#isSassConfigured = true;
                            Sass.options({
                                style: Sass.style.compressed
                            });
                            Sass._absolutePath = (e) => "/" + e;
                            Sass.importer(function(request, done) {
                                fetch(request.current)
                                    .then((response) => {
                                        if (response.ok)
                                            return response.text();
                                    })
                                    .then((data) => done({ content: data}));
                            });
                        }
                        const compiledCss = await new Promise(resolve =>
                            Sass.compile(element.innerHTML, response => resolve(response)));
                        if (compiledCss.status != 0)
                            throw new Error(compiledCss.formatted); 
                        element.innerHTML = compiledCss.text;
                        break;
                    default:
                        throw new UnknownLangException(langAttribute);
                }
            }

            document.head.appendChild(element);
        }
    }

    /**
     * @param {HTMLElement} componentElement
     * @returns {VirtualNode}
     */
    #CreateElement(componentElement) {
        const element = new VirtualNode(componentElement);
        element.MakeDynamic(this.Element);
        element.MakeComponent();
        element.RefName = this.Element.RefName;
        element.SlotName = this.Element.SlotName;
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
        const templateSlots = virtualNode.FilterNodes(element => element.Tag == "slot");
        const slots = this.Element.FilterNodes(element => element.Tag == "slot", false);
        let haveDefaultSlot = false;
        for (let templateSlot of templateSlots) {
            const templateSlotIdx = templateSlot.Parent.Elements.indexOf(templateSlot);
            if (!templateSlot.HtmlAttributes["name"] && haveDefaultSlot)
                throw new SlotRequiresNameAttributeException();
            let slotName = templateSlot.HtmlAttributes["name"];
            const slot = slots.find(element =>
                slotName ? element.HtmlAttributes["name"] == slotName : !element.HtmlAttributes["name"]);
            if (!slotName)
                slotName = "default";
            if (!slot) {
                if (templateSlot.HtmlAttributes["required"] == undefined) {
                    templateSlot.Parent.RemoveNode(templateSlotIdx);
                    continue;
                } else {
                    throw new ComponentRequiresSlotException(slotName);
                }
            }
            if (!slot.HtmlAttributes["name"]) {
                if (!haveDefaultSlot)
                    haveDefaultSlot = true;
                else
                    throw new SlotRequiresNameAttributeException();
            }
            if (slot.HtmlElement.children.length > 1)
                throw new SlotCanOnlyContainOneElementException();
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

    /**
     * @param {VirtualNode} virtualNode 
     * @returns {boolean}
     */
    static Init(virtualNode) {
        if (virtualNode.Tag == "component") {
            new ComponentAttribute(virtualNode);
            return true;
        }
        return false;
    }
}
