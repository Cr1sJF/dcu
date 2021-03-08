const vscode = require('vscode');
const dcu = require("./dcu");
const CONSTANTS = require("./CONS/CONSTANTS.json");


function extendObj(origin, add) {
    if (!add || (typeof add !== 'object' && add !== null)) {
        return origin;
    }

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
        origin[keys[i]] = add[keys[i]];
    }
    return origin;
};

function compare(a, b) {
    if (a === b) {
        return 0;
    }

    var a_components = a.split(".");
    var b_components = b.split(".");

    var len = Math.min(a_components.length, b_components.length);

    // loop while the components are equal
    for (var i = 0; i < len; i++) {
        // A bigger than B
        if (parseInt(a_components[i]) > parseInt(b_components[i])) {
            return 1;
        }

        // B bigger than A
        if (parseInt(a_components[i]) < parseInt(b_components[i])) {
            return -1;
        }
    }

    // If one's a prefix of the other, the longer one is greater.
    if (a_components.length > b_components.length) {
        return 1;
    }

    if (a_components.length < b_components.length) {
        return -1;
    }

    // Otherwise they are the same.
    return 0;
}

function validateVersion(STORAGE) {
    let currentVersion = vscode.extensions.getExtension('CrisJF.dcu-utils').packageJSON.version;
    let localVersion = STORAGE.get(CONSTANTS.STORAGE.VERSION);
    if (!STORAGE.get(CONSTANTS.STORAGE.VERSION) || compare(localVersion, currentVersion) == -1) {
        let nextVersionId;

        for (let i in CONSTANTS.VERSIONS.RELEASES) {
            if (localVersion === CONSTANTS.VERSIONS.RELEASES[i].V) {
                nextVersionId = CONSTANTS.VERSIONS.RELEASES[Number(i) + 1] ? CONSTANTS.VERSIONS.RELEASES[Number(i) + 1].id : CONSTANTS.VERSIONS.RELEASES[Number(i)].V;
                break;
            }
        }
        STORAGE.update(CONSTANTS.STORAGE.VERSION, currentVersion);


        if ((localVersion != nextVersionId) && dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.NOTIFY_UPDATES) === CONSTANTS.PREGUNTAR) {
            dcu.info({
                msg: "¿Quieres ver las mejoras de la versión " + currentVersion + "?",
                items: [CONSTANTS.SI, CONSTANTS.NO],
                callback: (response) => {
                    if (response === CONSTANTS.SI) {
                        vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=CrisJF.dcu-utils#' + nextVersionId));
                    }
                }
            });
        } else if ((localVersion != nextVersionId) && dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.NOTIFY_UPDATES) === CONSTANTS.SIEMPRE) {
            vscode.window.showInformationMessage(`Hey! Observa las novedades de DCU UTILS`);
            setTimeout(() => {
                vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=CrisJF.dcu-utils#' + nextVersionId));
            }, 3000)
        }
    }
}

module.exports = {
    compare: compare,
    validateVersion: validateVersion,
    extendObj: extendObj
};