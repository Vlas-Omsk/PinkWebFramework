import ExtendableProxy from "./ExtendableProxy.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalObserverHandler from "./GlobalObserverHandler.js";
import GlobalValueChangedEventArgs from "./GlobalValueChangedEventArgs.js";
import ObservableArray from "./ObservableArray.js";
import ValueChangedEventArgs from "./ValueChangedEventArgs.js";

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
     * @param {string} type
     * @param {*} object
     * @param {string | symbol} key
     * @param {*} value
     */
    #Dispatch(type, object, key, value) {
        this.#eventTarget.Dispatch(new ValueChangedEventArgs(object, key, value, type, this));
        GlobalObserverHandler.Dispatch(new GlobalValueChangedEventArgs(this.#eventTarget, object, key, value, type, this));
    }

    /**
     * @param {*} object
     * @param {string | symbol} key
     * @returns {*}
     */
    #OnGet(object, key) {
        const value = object[key];
        if (!(key in ObservableObject.prototype))
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