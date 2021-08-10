// const vscode = require("vscode");
// const utils = require("../utils");
// const CONSTANTS = require("../CONS/CONSTANTS.json");
const global = {
    getGlobalVar: (varName) => {
        return global.vars[varName] || null;
    },

    VARS_NAMES: {
        OCC_FOLDERS: "occFolders",
		OCC_ENV_DATA: "occEnvData"
    },
    vars: {},

    setGlobalVar: (varName, value) => {
        global.vars[varName] = value;
    }
}


module.exports = global;