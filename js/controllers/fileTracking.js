const utils = require("../utils");
const vscode = require("vscode");
const CONST = require("../CONS/CONSTANTS.json");
const TEXTS = require("../CONS/TEXTS.json").FILE_TRACKING;
let fileTracking;

const init = () => {
    if (utils.getConfig(CONST.CONFIG.GENERAL.NAME, CONST.CONFIG.GENERAL.PROPS.FILE_TRACKING)) {
        fileTracking = vscode.window.createOutputChannel(TEXTS.OUTPUT_NAME);
        fileTracking.appendLine(
            TEXTS.SESSION_STARTED
        );
    }
}

const track = (msg) => {
    if (fileTracking) {
        fileTracking.appendLine(msg);
        fileTracking.appendLine("");
    }
}

module.exports = {
    init,
    track
}