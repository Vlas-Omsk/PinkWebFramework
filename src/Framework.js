// ./Attributes/
import AttributesInitializer from "./Attributes/AttributesInitializer.js";
import BindAttribute from "./Attributes/BindAttribute.js";
import ComponentAttribute from "./Attributes/ComponentAttribute.js";
import EventAttribute from "./Attributes/EventAttribute.js";
import ForAttribute from "./Attributes/ForAttribute.js";
import RefAttribute from "./Attributes/RefAttribute.js";
import ValueAttribute from "./Attributes/ValueAttribute.js";
import VirtualNodeAttribute from "./Attributes/VirtualNodeAttribute.js";

window.AttributesInitializer = AttributesInitializer;
window.BindAttribute = BindAttribute;
window.ComponentAttribute = ComponentAttribute;
window.EventAttribute = EventAttribute;
window.ForAttribute = ForAttribute;
window.RefAttribute = RefAttribute;
window.ValueAttribute = ValueAttribute;
window.VirtualNodeAttribute = VirtualNodeAttribute;

// ./Exceptions.js
import * as Exceptions from "./Exceptions.js";

window.FrameworkException = Exceptions.FrameworkException;
window.IndexOutOfRangeException = Exceptions.IndexOutOfRangeException;
window.NotImplementedException = Exceptions.NotImplementedException;
window.ComponentRequiresSrcAttributeException = Exceptions.ComponentRequiresSrcAttributeException;
window.ComponentCanOnlyContainOneElementException = Exceptions.ComponentCanOnlyContainOneElementException;
window.ComponentRequiresSlotException = Exceptions.ComponentRequiresSlotException;
window.SlotRequiresNameAttributeException = Exceptions.SlotRequiresNameAttributeException;
window.SlotCanOnlyContainOneElementException = Exceptions.SlotCanOnlyContainOneElementException;
window.BindingMustReturnDifferentTypeException = Exceptions.BindingMustReturnDifferentTypeException;
window.UnknownLangException = Exceptions.UnknownLangException;
window.LangNotLoadedException = Exceptions.LangNotLoadedException;

// ./
import ExtendableProxy from "./ExtendableProxy.js";
import FrameworkEventArgs from "./FrameworkEventArgs.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalObserverHandler from "./GlobalObserverHandler.js";
import GlobalValueChangedEventArgs from "./GlobalValueChangedEventArgs.js";
import ObservableArray from "./ObservableArray.js";
import ObservableObject from "./ObservableObject.js";
import ValueChangedEventArgs from "./ValueChangedEventArgs.js";
import VirtualNode from "./VirtualNode.js";
import VirtualNodeContext from "./VirtualNodeContext.js";
import VirtualNodeEventArgs from "./VirtualNodeEventArgs.js";

window.ExtendableProxy = ExtendableProxy;
window.FrameworkEventArgs = FrameworkEventArgs;
window.FrameworkEventTarget = FrameworkEventTarget;
window.GlobalObserverHandler = GlobalObserverHandler;
window.GlobalValueChangedEventArgs = GlobalValueChangedEventArgs;
window.ObservableArray = ObservableArray;
window.ObservableObject = ObservableObject;
window.ValueChangedEventArgs = ValueChangedEventArgs;
window.VirtualNode = VirtualNode;
window.VirtualNodeContext = VirtualNodeContext;
window.VirtualNodeEventArgs = VirtualNodeEventArgs;

const frameworkPrefix = "PinkFramework";

class Framework {
    /** @type {Framework} */ static #instance = new Framework()

    static get Instance() {
        return this.#instance;
    }

    /** @type {VirtualNode} */ #virtualBody
    /** @type {object[]} */ #asyncTasks = []

    get VirtualBody() {
        return this.#virtualBody;
    }

    /**
     * @private
     */
    constructor() {
    }

    /**
     * @param {object} asyncTaskObject 
     */
    AsyncTaskBegin(asyncTaskObject) {
        this.#asyncTasks.push(asyncTaskObject);
    }

    /**
     * @param {object} asyncTaskObject 
     */
    AsyncTaskEnd(asyncTaskObject) {
        this.#asyncTasks = this.#asyncTasks.filter(task => task != asyncTaskObject);
        if (this.#asyncTasks.length == 0) {
            console.log(`[${frameworkPrefix}] FrameworkAsyncTasksCompleated`);
            window.dispatchEvent(new CustomEvent("FrameworkAsyncTasksCompleated", {}));
        }
    }

    Create() {
        window.dispatchEvent(new CustomEvent("FrameworkInitialization", {}));
        this.#virtualBody = new VirtualNode(document.body);
        AttributesInitializer.InitAttributes(this.#virtualBody);

        console.log(`[${frameworkPrefix}] FrameworkSyncTasksCompleated`);
        window.dispatchEvent(new CustomEvent("FrameworkSyncTasksCompleated", {}));

        if (this.#asyncTasks.length == 0)
            this.#OnInitialized();
        else
            window.addEventListener("FrameworkAsyncTasksCompleated", this.#OnInitialized.bind(this));
    }

    #OnInitialized() {
        window.removeEventListener("FrameworkAsyncTasksCompleated", this.#OnInitialized);
        console.log(`[${frameworkPrefix}] FrameworkInitialized`);
        window.dispatchEvent(new CustomEvent("FrameworkInitialized", {}));
    }
}

if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function(str, newStr){
		// If a regex pattern
		if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
			return this.replace(str, newStr);
		}
		// If a string
		return this.replace(new RegExp(str, 'g'), newStr);
	};
}

String.isEmpty = function(self) {
    return (self.length === 0 || !self.trim());
};
String.isNullOrEmpty = function(self) {
    return (!self || String.isEmpty(self));
};
String.hashCode = function(self) {
    var hash = 0, i, chr;
    if (self.length === 0) return hash;
    for (i = 0; i < self.length; i++) {
        chr   = self.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
Array.insert = function(self, index, item) {
    Array.prototype.splice.call(self, index, 0, item)
};
Array.removeAt = function(self, index) {
    Array.prototype.splice.call(self, index, 1)
};

document.addEventListener("DOMContentLoaded", () => Framework.Instance.Create());
window.Framework = Framework.Instance;