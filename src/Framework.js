import ExtendableProxy from "./ExtendableProxy.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalObserverHandler from "./GlobalObserverHandler.js";
import ObservableObject from "./ObservableObject.js";
import ValueElement from "./ValueElement.js";
import VirtualNode from "./VirtualNode.js";
import VirtualNodeContext from "./VirtualNodeContext.js";

window.ExtendableProxy = ExtendableProxy;
window.FrameworkEventTarget = FrameworkEventTarget;
window.GlobalObserverHandler = GlobalObserverHandler;
window.ObservableObject = ObservableObject;
window.ValueElement = ValueElement;
window.VirtualNode = VirtualNode;
window.VirtualNodeContext = VirtualNodeContext;

class Framework {
    /** @type {VirtualNode} */ VirtualBody

    Create() {
        this.VirtualBody = new VirtualNode(document.body);
        ValueElement.InitElements(this.VirtualBody);

        console.log("FrameworkCreated");
        document.dispatchEvent(new CustomEvent("FrameworkCreated", {}));
    }
}

const framework = new Framework();
document.addEventListener("DOMContentLoaded", () => framework.Create());
window.Framework = framework;