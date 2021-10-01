import ExtendableProxy from "./ExtendableProxy.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalObserverHandler from "./GlobalObserverHandler.js";
import ObservableObject from "./ObservableObject.js";

export default class ObservableArray extends ExtendableProxy {
    /** @type {FrameworkEventTarget} */ #eventTarget = new FrameworkEventTarget()
    /** @type {any[]} */ #object = []

    get IObservable() {
        return true;
    }

    /**
     * @param {Object} object
     */
    constructor(object) {
        Object.setPrototypeOf(object, ObservableArray.prototype);
        const parameters = { target: object, handler: {} };
        super(parameters, false);
        parameters.handler.get = this.#OnGet.bind(this);
        parameters.handler.set = this.#OnSet.bind(this);
        this.#object = parameters.target;
    }

    /**
     * @param {...any} items 
     */
    Push(...items) {
        let idx = this.#object.length;
        for (let i = idx; i < idx + items.length; i++) {
            this.#object[i] = this.#ProcessValue(items[i - idx]);
            this.#Dispatch("add", this.#object, i, this.#object[i]);
        }
    }

    /**
     * @param {number} index
     */
    RemoveAt(index) {
        Array.removeAt(this.#object, index);
        this.#Dispatch("remove", this.#object, index, this.#object[index]);
    }

    /**
     * @param {any} item
     */
    Remove(item) {
        let index = -1;
        for (let i = 0; i < this.#object.length; i++)
            if (this.#object[i] == item) {
                index = i;
                break;
            }
        if (index == -1)
            throw Error("Item not contains in array");
        this.RemoveAt(index);
    }

    /**
     * @param {number} index
     * @param {any} item
     */
    Insert(index, ...items) {
        for (let i = index; i < index + items.length; i++) {
            const value = this.#ProcessValue(items[i - index]);
            Array.insert(this.#object, i, value);
            this.#Dispatch("add", this.#object, i, value);
        }
    }

    //*[Symbol.iterator]()
    [Symbol.iterator]() {
        let index = -1;
        const data = this.#object;
        const dispatch = this.#Dispatch.bind(this);

        return {
            next() {
                index++;
                dispatch("get", data, index, data[index]);
                return {
                    value: data[index],
                    done: !(index in data)
                }
            }
        };
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

        value = this.#ProcessValue(value);
        object[key] = value;

        if (isAdded)
            this.#Dispatch("add", object, key, value);
        else
            this.#Dispatch("set", object, key, value);

        return true;
    }

    /**
     * @param {any} value
     * @returns {any}
     */
    #ProcessValue(value) {
        if (value instanceof Array)
            value = new ObservableArray(value);
        else if (value instanceof Object)
            value = new ObservableObject(value);
        return value;
    }
}