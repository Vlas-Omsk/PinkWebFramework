export class FrameworkException extends Error {
    /**
     * @param {string} message 
     */
    constructor (message) {
        super();
        this.message = `${this.constructor.name}:\r\n${message}`;
    }
}

export class IndexOutOfRangeException extends FrameworkException {
    /**
     * @param {string} parameterName 
     */
    constructor(parameterName) {
        super(`Index was out of range. Must be non-negative and less than the size of the collection.\r\nParameter name: ${parameterName}`);
    }
}

export class NotImplementedException extends FrameworkException {
    /**
     * @param {string} message 
     */
    constructor(message) {
        super(message);
    }
}

export class ComponentRequiresSrcAttributeException extends FrameworkException {
    constructor() {
        super("Component requires 'src' attribute");
    }
}

export class ComponentCanOnlyContainOneElementException extends FrameworkException {
    constructor() {
        super("A component can only contain one element");
    }
}

export class ComponentRequiresSlotException extends FrameworkException {
    /**
     * @param {string} slotName 
     */
    constructor(slotName) {
        super(`The component requires a slot '${slotName}'`);
    }
}

export class SlotRequiresNameAttributeException extends FrameworkException {
    constructor() {
        super("Slot requires 'name' attribute");
    }
}

export class SlotCanOnlyContainOneElementException extends FrameworkException {
    constructor() {
        super("A slot can only contain one element");
    }
}

export class BindingMustReturnDifferentTypeException extends FrameworkException {
    /**
     * @param {string} typeName 
     */
    constructor(typeName) {
        super(`The binding must return a '${typeName}' type`);
    }
}

export class UnknownLangException extends FrameworkException {
    /**
     * @param {string} langName 
     */
    constructor(langName) {
        super(`Unknown lang '${langName}'`);
    }
}

export class LangNotLoadedException extends FrameworkException {
    /**
     * @param {string} langName 
     * @param {string} packageUrl
     */
    constructor(langName, packageUrl) {
        super(`Language '${langName}' not loaded, include ${packageUrl} in the main page head to use the specified language`);
    }
}