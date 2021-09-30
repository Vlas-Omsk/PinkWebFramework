export default class ExtendableProxy {
    /**
     * @param {Object} parameters
     * @param {Object} parameters.target
     * @param {ProxyHandler<>} parameters.handler
     * @param {boolean} combineWithThis
     */
    constructor(parameters, combineWithThis) {
        if (combineWithThis)
            parameters.target = Object.assign(this, parameters.target)
        return new Proxy(parameters.target, parameters.handler);
    }
}