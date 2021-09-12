export default class ExtendableProxy {
    /**
     * @param {Object} parameters
     * @param {Object} parameters.target
     * @param {ProxyHandler<>} parameters.handler
     */
    constructor(parameters) {
        return new Proxy(parameters.target = Object.assign(this, parameters.target), parameters.handler);
    }
}