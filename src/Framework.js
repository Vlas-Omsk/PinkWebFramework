import AttributesInitializer from "./Attributes/AttributesInitializer.js";
import ForElement from "./Attributes/ForAttribute.js";
import ValueElement from "./Attributes/ValueAttribute.js";
import VirtualNodeAttribute from "./Attributes/VirtualNodeAttribute.js";
import ExtendableProxy from "./ExtendableProxy.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalObserverHandler from "./GlobalObserverHandler.js";
import ObservableArray from "./ObservableArray.js";
import ObservableObject from "./ObservableObject.js";
import VirtualNode from "./VirtualNode.js";
import VirtualNodeContext from "./VirtualNodeContext.js";

window.ExtendableProxy = ExtendableProxy;
window.ForElement = ForElement;
window.FrameworkEventTarget = FrameworkEventTarget;
window.GlobalObserverHandler = GlobalObserverHandler;
window.ObservableArray = ObservableArray;
window.ObservableObject = ObservableObject;
window.ValueElement = ValueElement;
window.VirtualNode = VirtualNode;
window.VirtualNodeContext = VirtualNodeContext;

class Framework {
    /** @type {VirtualNode} */ #virtualBody

    get VirtualBody() {
        return this.#virtualBody;
    }

    Create() {
        window.dispatchEvent(new CustomEvent("FrameworkInitialization", {}));
        this.#virtualBody = new VirtualNode(document.body);
        AttributesInitializer.InitAttributes(this.#virtualBody);

        console.log("FrameworkInitialized");
        window.dispatchEvent(new CustomEvent("FrameworkInitialized", {}));
    }
}

String.isNullOrEmpty = function(self) {
    return (!self || self.length === 0 || !self.trim());
}
Array.insert = function(self, index, item) {
    Array.prototype.splice.call(self, index, 0, item)
};
Array.removeAt = function(self, index) {
    Array.prototype.splice.call(self, index, 1)
};

const framework = new Framework();
document.addEventListener("DOMContentLoaded", () => framework.Create());
window.Framework = framework;