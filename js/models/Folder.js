const utils = require("../utils");

class Folder {
    constructor(data) {
        this.environment = data.environment;
        this.path = data.path;
        this.children = data.children.children ? data.children : data;
    }

    findComponent(component) {
        let result = utils.findComponentInNode(this.children, component);
        return result;
    }
}

module.exports = Folder;