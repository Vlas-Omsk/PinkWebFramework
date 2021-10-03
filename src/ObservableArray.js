import { IndexOutOfRangeException } from "./Exceptions.js";
import ExtendableProxy from "./ExtendableProxy.js";
import FrameworkEventTarget from "./FrameworkEventTarget.js";
import GlobalObserverHandler from "./GlobalObserverHandler.js";
import GlobalValueChangedEventArgs from "./GlobalValueChangedEventArgs.js";
import ObservableObject from "./ObservableObject.js";
import ValueChangedEventArgs from "./ValueChangedEventArgs.js";

export default class ObservableArray extends ExtendableProxy {
    /** @type {FrameworkEventTarget<ValueChangedEventArgs>} */ #eventTarget = new FrameworkEventTarget()
    /** @type {any[]} */ #object = []

    get IObservable() {
        return true;
    }

    /**
     * @param {Object} object
     */
    constructor(object) {
        const parameters = { target: object, handler: {} };
        super(parameters, ObservableArray.prototype);
        parameters.handler.get = this.#OnGet.bind(this);
        parameters.handler.set = this.#OnSet.bind(this);
        this.#object = parameters.target;
    }

    Clear() {
        while (this.#object.length > 0)
            this.RemoveAt(0);
    }

    /**
     * @param {number} from 
     * @param {number} to 
     */
    Swap(from, to) {
        const tempObj = this.#object[from];
        this.#object[from] = this.#object[to];
        this.#object[to] = tempObj;

        this.#Dispatch("set", this.#object, from, this.#object[from]);
        this.#Dispatch("set", this.#object, to, this.#object[to]);
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
        if (index < 0 || index >= this.#object.length)
            throw new IndexOutOfRangeException("index");

        Array.removeAt(this.#object, index);
        this.#Dispatch("remove", this.#object, index, this.#object[index]);
    }

    /**
     * @param {any} item
     * @returns {boolean}
     */
    Remove(item) {
        let index = -1;
        for (let i = 0; i < this.#object.length; i++)
            if (this.#object[i] == item) {
                index = i;
                break;
            }
        if (index == -1)
            return false;
        this.RemoveAt(index);
        return true;
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
        if (!(key in ObservableArray.prototype))
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