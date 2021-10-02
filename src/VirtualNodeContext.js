import ExtendableProxy from "./ExtendableProxy.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalObserverHandler from "./GlobalObserverHandler.js";
import GlobalValueChangedEventArgs from "./GlobalValueChangedEventArgs.js";
import ValueChangedEventArgs from "./ValueChangedEventArgs.js";
import VirtualNode from "./VirtualNode.js";

/**
 * @typedef {Object} HookGetEventArgs
 * @property {*} object
 * @property {string | symbol} key
 * @property {boolean} handled
 * @property {VirtualNodeContext} sender
 */

/**
 * @callback HookGetEventHandler
 * @param {HookGetEventArgs} e
 * @returns {*}
 */

/**
 * @typedef {Object} HookSetEventArgs
 * @property {*} object
 * @property {string | symbol} key
 * @property {*} value
 * @property {boolean} handled
 * @property {VirtualNodeContext} sender
 */

/**
 * @callback HookSetEventHandler
 * @param {HookSetEventArgs} e
 * @returns {void}
 */

/**
 * @typedef {Object} HookHandler
 * @property {?HookGetEventHandler} get
 * @property {?HookSetEventHandler} set
 */

export default class VirtualNodeContext extends ExtendableProxy {
    /** @type {VirtualNode} */ #virtualNode
    /** @type {FrameworkEventTarget} */ #eventTarget = new FrameworkEventTarget()
    /** @type {HookHandler[]} */ #hookHandlers = []
    /** @type {any} */ #object

    /**
     * @param {VirtualNode} virtualNode
     */
    constructor(virtualNode) {
        const parameters = { target: {}, handler: {} };
        super(parameters, VirtualNodeContext.prototype);
        parameters.handler.get = this.#OnGet.bind(this);
        parameters.handler.set = this.#OnSet.bind(this);
        this.#object = parameters.target;
        this.#virtualNode = virtualNode;
    }

    /**
     * @param {string} script 
     * @returns {any}
     */
    EvalScript(script) {
        return eval(script);
    }

    /**
     * @param {HookHandler} hookHandler 
     */
    AddHook(hookHandler) {
        this.#hookHandlers.push(hookHandler);
    }

    /**
     * @param {HookHandler} hookHandler 
     */
    RemoveHook(hookHandler) {
        this.#hookHandlers = this.#hookHandlers.filter(handler => handler != hookHandler);
    }

    /**
     * @param {string} type
     * @param {import("./FrameworkEventTarget").EventHandler<ValueChangedEventArgs>} callback
     */
    On(type, callback) {
        this.#eventTarget.On(type, callback);
    }

    /**
     * @param {string} type
     * @param {import("./FrameworkEventTarget").EventHandler<ValueChangedEventArgs>} callback
     */
    Off(type, callback) {
        this.#eventTarget.Off(type, callback);
    }

    /**
     * @param {string} name
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     */
    #Dispatch(name, object, key, value) {
        this.#eventTarget.Dispatch(new ValueChangedEventArgs(object, key, value, name, this));
        GlobalObserverHandler.Dispatch(new GlobalValueChangedEventArgs(this.#eventTarget, object, key, value, name, this));
    }

    /**
     * @param {*} object
     * @param {string | symbol} key
     * @returns {*}
     */
    #OnGet(object, key) {
        /** @type {HookGetEventArgs} */
        const e = { object, key, handled: false, sender: this };
        for (let hookHandler of this.#hookHandlers) {
            if (!hookHandler.get)
                continue;
            const value = hookHandler.get(e);
            if (e.handled)
                return value;
        }
        if (key in object) {
            const value = object[key];
            if (!(key in VirtualNodeContext.prototype))
                this.#Dispatch("get", object, key, value);
            return value;
        }
        if (key.length > 0 && key[0] == '$') {
            if (key.length == 1) {
                return this.#virtualNode;
            } else {
                const nodeKey = key[1].toUpperCase() + key.slice(2);
                if (nodeKey in this.#virtualNode) {
                    const value = this.#virtualNode[nodeKey];
                    if (value instanceof Function)
                        return value.bind(this.#virtualNode);
                    else
                        return value;
                }
            }
        }
        if (!this.#virtualNode.IsComponent && this.#virtualNode.Parent)
            return this.#virtualNode.Parent.Context[key];
        else
            return window[key];
    }

    /**
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     * @returns {boolean}
     */
    #OnSet(object, key, value) {
        /** @type {HookSetEventArgs} */
        const e = { object, key, value, handled: false, sender: this };
        for (let hookHandler of this.#hookHandlers) {
            if (!hookHandler.set)
                continue;
            hookHandler.set(e);
            if (e.handled)
                return true;
        }
        if (!this.#DeepSetValue(key, value))
            object[key] = value;
        
        return true;
    }

    /**
     * @param {string | symbol} key
     * @param {*} value
     * @returns {boolean}
     */
    #DeepSetValue(key, value) {
        if (key in this.#object) {
            this.#object[key] = value;
            this.#Dispatch("set", this.#object, key, value);
            return true;
        }
        if (this.#virtualNode.Parent) {
            if (!this.#virtualNode.IsComponent)
                return this.#virtualNode.Parent.Context.#DeepSetValue(key, value);
        } else {
            if (key in window) {
                window[key] = value;
                return true;
            }
        }
        return false;
    }
}