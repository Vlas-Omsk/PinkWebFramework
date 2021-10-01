import ExtendableProxy from "./ExtendableProxy.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalObserverHandler from "./GlobalObserverHandler.js";
import ObservableArray from "./ObservableArray.js";

export default class ObservableObject extends ExtendableProxy {
    /** @type {FrameworkEventTarget} */ #eventTarget = new FrameworkEventTarget();

    get IObservable() {
        return true;
    }

    /**
     * @param {Object} object
     */
    constructor(object) {
        const parameters = { target: object, handler: {} };
        super(parameters, ObservableObject.prototype);
        parameters.handler.get = this.#OnGet.bind(this);
        parameters.handler.set = this.#OnSet.bind(this);
    }

    /**
     * @param {string} name
     * @param {import("./FrameworkEventTarget").ChangedEventHandler} callback
     */
    On(name, callback) {
        this.#eventTarget.On(name, callback);
    }

    /**
     * @param {string} name
     * @param {import("./FrameworkEventTarget").ChangedEventHandler} callback
     */
    Off(name, callback) {
        this.#eventTarget.Off(name, callback);
    }

    /**
     * @param {string} name
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     */
    #Dispatch(name, object, key, value) {
        this.#eventTarget.Dispatch(name, object, key, value);
        GlobalObserverHandler.Dispatch(name, object, key, value);
    }

    /**
     * @param {*} object
     * @param {string | symbol} key
     * @returns {*}
     */
    #OnGet(object, key) {
        const value = object[key];
        this.#Dispatch("get", object, key, value);
        return value;
    }

    /**
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     * @returns {boolean}
     */
    #OnSet(object, key, value) {
        const isAdded = !(key in object);

        if (value instanceof Array)
            value = new ObservableArray(value);
        else if (value instanceof Object)
            value = new ObservableObject(value);
        object[key] = value;

        if (isAdded)
            this.#Dispatch("add", object, key, value);
        else
            this.#Dispatch("set", object, key, value);

        return true;
    }
}