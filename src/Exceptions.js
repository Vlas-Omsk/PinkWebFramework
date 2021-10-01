export class IndexOutOfRangeException extends RangeError {
    /**
     * @param {string} parameterName 
     */
    constructor(parameterName) {
        super("IndexOutOfRangeException:\r\nIndex was out of range. Must be non-negative and less than the size of the collection.\r\nParameter name: " + parameterName);
    }
}

export class NotImplementedException extends Error {
    /**
     * @param {string} message 
     */
    constructor(message) {
        super("NotImplementedException:\r\n" + message);
    }
}

export class ComponentRequiresSrcAttribute extends Error {
    constructor() {
        super("ComponentRequiresSrcAttribute:\r\nComponent requires src attribute");
    }
}

export class ComponentCanOnlyContainOneElement extends Error {
    constructor() {
        super("ComponentCanOnlyContainOneElement:\r\nA component can only contain one element");
    }
}