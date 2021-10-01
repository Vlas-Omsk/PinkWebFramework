export default class ExtendableProxy {
    /**
     * @param {Object} parameters
     * @param {Object} parameters.target
     * @param {ProxyHandler<>} parameters.handler
     * @param {object} prototype
     */
    constructor(parameters, prototype) {
        if (prototype)
            Object.setPrototypeOf(parameters.target, prototype);
        return new Proxy(parameters.target, parameters.handler);
    }
}