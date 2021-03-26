const vscode = require('vscode');
const fs = require('fs');
const { URL } = require('url');
const DcuItemBar = require('./DcuItemBar');
const cmd = require('node-cmd');
const utils = require("./utils");
// const { callbackify } = require('util');
// const { isOptionalChain } = require('typescript');
// const { createClassifier } = require('typescript');
// const { env } = require('process');
const output = vscode.window.createOutputChannel("DCU INFO");
let fileTracking;
const CONST = require("./CONS/CONSTANTS.json");
// const { isTemplateMiddle } = require('typescript');

/**
 * 
 * @param {{
 * data: string,
 * error: string,
 * sterror: string
 * }} data 
 * 
 * @returns any {{
 *  error: string,
 * success: string,
 * code: number
 * }}
 */
function analizeResponse(data) {
    if (data.error) {
        return {
            ERROR: data.error,
            STATUS: CONST.STATUS.FAIL
        }
    }
    let keywords = require("./CONS/KEYWORDS.json");
    let response = {};

    for (var key in keywords) {
        if (data.sterror.indexOf(key) != -1) {
            response[keywords[key]] ? response[keywords[key]] += "\n" + data.sterror : response[keywords[key]] = data.sterror;
        }
    }
    response.INFO ? response.INFO += "\n" + data.data : response.INFO = data.data;

    if (response.ERROR) {
        response.STATUS = CONST.STATUS.FAIL;
    } else {
        response.STATUS = CONST.STATUS.SUCCESS;
    }

    return response;
}

function findEnvironment(folder) {
    let env = {
        basePath: "",
        env: "",
        occVersion: "",
        dcuVersion: "",
        key: "",
        fileType: null,
        componentName: "",
        componentPath: "",
        settings: "",
        envUrl: null
    };

    let configPath;
    if (!folder) {
        let editor = vscode.window.visibleTextEditors.find((editor) => {
            return editor.document.languageId != CONST.EDITORS.LOG;
        });
        if (editor) {
            let path = editor.document.uri.path.split("/").splice(1);
            for (let i in CONST.VALID_PATHS) {
                var componentType = CONST.VALID_PATHS[i];
                if (path.indexOf(componentType) != -1) {
                    env.fileType = componentType;
                    if (componentType === CONST.COMPONENTS.WIDGET || componentType === CONST.COMPONENTS.ELEM || componentType === CONST.COMPONENTS.THEME) {
                        env.componentName = path[path.indexOf(componentType) + 1];
                        env.componentPath = path.slice(0, path.indexOf(env.fileType) + 2).join("/");
                    } else {
                        env.componentName = path[path.indexOf(componentType)];
                        env.componentPath = path.slice(0, (path.indexOf(env.fileType) + 1)).join("/");
                    }
                    break;
                }
            }

            if (env.fileType) {
                path.splice(path.indexOf(env.fileType));
                env.basePath = path.join("/");

                configPath = env.basePath + "/.ccc/config.json";

            } else {
                return null;
            }
        } else {
            return null;
        }
    } else {
        configPath = folder.uri.path.substring(1) + "/.ccc/config.json";
        env.basePath = folder.uri.path.substring(1);
    }

    let rawData = fs.readFileSync(configPath);
    let envConfig = JSON.parse(rawData.toString());
    env.envUrl = new URL(envConfig.node);
    env.occVersion = envConfig.commerceCloudVersion;
    env.dcuVersion = envConfig.packageVersion;


    if (getConfig(CONST.CONFIG.DEV, CONST.CONFIG.PROPS.ENVIROMENT_URL) && new URL(getConfig(CONST.CONFIG.DEV, CONST.CONFIG.PROPS.ENVIROMENT_URL)).origin === env.envUrl.origin) {
        env.settings = CONST.CONFIG.DEV;
        env.env = CONST.ENV.DEV;
        env.key = getConfig(env.settings, CONST.CONFIG.PROPS.APP_KEY);
        return env;
    } else if (getConfig(CONST.CONFIG.TEST, CONST.CONFIG.PROPS.ENVIROMENT_URL) && new URL(getConfig(CONST.CONFIG.DEV, CONST.CONFIG.PROPS.ENVIROMENT_URL)).origin === env.envUrl.origin) {
        env.settings = CONST.CONFIG.TEST;
        env.env = CONST.ENV.TEST;
        env.key = getConfig(env.settings, CONST.CONFIG.PROPS.APP_KEY);
        return env;
    } else if (getConfig(CONST.CONFIG.STAGE, CONST.CONFIG.PROPS.ENVIROMENT_URL) && new URL(getConfig(CONST.CONFIG.DEV, CONST.CONFIG.PROPS.ENVIROMENT_URL)).origin === env.envUrl.origin) {
        env.settings = CONST.CONFIG.STAGE;
        env.env = CONST.ENV.STAGE;
        env.key = getConfig(env.settings, CONST.CONFIG.PROPS.APP_KEY);
        return env;
    } else if (getConfig(CONST.CONFIG.PROD, CONST.CONFIG.PROPS.ENVIROMENT_URL) && new URL(getConfig(CONST.CONFIG.DEV, CONST.CONFIG.PROPS.ENVIROMENT_URL)).origin === env.envUrl.origin) {
        env.settings = CONST.CONFIG.PROD;
        env.env = CONST.ENV.PROD;
        env.key = getConfig(env.settings, CONST.CONFIG.PROPS.APP_KEY);
        return env;
    }
    return null;
};

function replace(source, replaceWith) {
    if (replaceWith && typeof replaceWith === 'object') {
        var response = new String(source);
        Object.keys(replaceWith).forEach(function (value) {
            response = response.replace(new RegExp("@@" + value + "@@", "g"), replaceWith[value]);
        });
        return response;
    } else {
        return source;
    }
};

function getConfig(key, subKey) {
    if (!subKey) {
        return vscode.workspace.getConfiguration(key)
    } else if (vscode.workspace.getConfiguration(key)) {
        return vscode.workspace.getConfiguration(key).get(subKey);
    } else {
        return null;
    }
}

function log({ section, title, detail }) {
    if (section) {
        output.appendLine(`################   ${section}    ##################`)
    } if (title) {
        output.appendLine(title);
        let str = "";

        for (let index = 0; index < title.length; index++) {
            str += "‾";
        }
        output.appendLine(str);
    } if (detail) {
        output.appendLine("");
        output.appendLine(detail);
    }
};

/**
    * Displays a notification
    * @param {{
    * title: String,
    * msg: String, 
    * replace: Object,
    * replaceOptions: Object,
    * type: String,
    * detail: String,
    * items: Array,
    * callback: Function
    * log: Boolean
    * }} opt
    */
async function putMessage(opt) {
    let msg = replace(opt.msg, opt.replaceOptions || opt.replace);
    switch (opt.type) {
        case CONST.MGS_TYPES.INFO || CONST.MGS_TYPES.SUCCESS:
            if (opt.items) {
                let response = await vscode.window.showInformationMessage(msg, opt.items[0], opt.items[1], opt.items[2]);
                if (response) {
                    if (opt.callback) {
                        opt.callback(response);
                        return;
                    } else {
                        return response;
                    }
                }
            } else {
                vscode.window.showInformationMessage(msg);
            }
            break;
        case CONST.MGS_TYPES.WARN:
            if (opt.items) {
                let response = await vscode.window.showWarningMessage(msg, opt.items[0], opt.items[1], opt.items[2]);
                if (response) {
                    if (opt.callback) {
                        opt.callback(response);
                        return;
                    } else {
                        return response;
                    }
                }
            } else {
                vscode.window.showWarningMessage(msg);
            }
            break;
        case CONST.MGS_TYPES.ERROR:
            if (opt.items) {
                let response = await vscode.window.showErrorMessage(msg, opt.items[0], opt.items[1], opt.items[2]);
                if (response) {
                    if (opt.callback) {
                        opt.callback(response);
                        return;
                    } else {
                        return response;
                    }
                }
            } else {
                vscode.window.showErrorMessage(msg);
            }
            if (opt.detail) {
                output.show();
            }
            break;
    }

    output.show();
}

module.exports = {
    CONST: CONST,

    /**
     * Displays an ERROR notification
    * @param {({
        * msg: String, 
        * title?: String,
        * replace?: Object,
        * replaceOptions?: any,
        * detail?: String,
        * items?: Array,
        * callback?: Function
        * log?: Boolean = false
        * } | string)} options
     */
    error: async function (options) {
        let model = utils.extendObj({}, options);
        if (typeof options === "string") {
            model = {
                msg: options,
                type: CONST.MGS_TYPES.ERROR
            };
        } else {
            model.msg = CONST.MSGS[options.msg] ? CONST.MSGS[options.msg] : options.msg;
            model.type = CONST.MGS_TYPES.ERROR;
        }
        return await putMessage(model);
    },

    /**
     * Displays an INFO notification
     * @param {({
        * msg: String, 
        * title?: String,
        * replace?: Object,
        * replaceOptions?: any,
        * detail?: String,
        * items?: Array,
        * callback?: Function
        * log?: Boolean = false
        * } | string)} options
     */
    info: async function (options) {
        let model = utils.extendObj({}, options);
        if (typeof options === "string") {
            model = {
                msg: options,
                type: CONST.MGS_TYPES.INFO
            };
        } else {
            model.msg = CONST.MSGS[options.msg] ? CONST.MSGS[options.msg] : options.msg;
            model.type = CONST.MGS_TYPES.INFO;
        }

        return await putMessage(model);
    },

    /**
     * Displays an INFO notification
    * @param {({
        * msg: String, 
        * title?: String,
        * replace?: Object,
        * replaceOptions?: any,
        * detail?: String,
        * items?: Array,
        * callback?: Function
        * log?: Boolean = false
        * } | string)} options
     */
    success: async function (options) {
        let model = utils.extendObj({}, options);
        if (typeof options === "string") {
            model = {
                msg: options,
                type: CONST.MGS_TYPES.INFO
            };
        } else {
            model.msg = CONST.MSGS[options.msg] ? CONST.MSGS[options.msg] : options.msg;
            model.type = CONST.MGS_TYPES.INFO;
        }
        return await putMessage(model);
    },

    /**
     * Displays an WARN notification
    * @param {({
        * msg: String, 
        * title?: String,
        * replace?: Object,
        * replaceOptions?: any,
        * detail?: String,
        * items?: Array,
        * callback?: Function
        * log?: Boolean = false
        * } | string)} options
     */
    warn: async function (options) {
        let model = utils.extendObj({}, options);
        if (typeof options === "string") {
            model = {
                msg: options,
                type: CONST.MGS_TYPES.WARN
            };
        } else {
            model.msg = CONST.MSGS[options.msg] ? CONST.MSGS[options.msg] : options.msg;
            model.type = CONST.MGS_TYPES.WARN;
        }
        return await putMessage(model);
    },

    findEnvironment: findEnvironment,
    getConfig: getConfig,
    showOutput: function () {
        output.show();
    },
    initializeFileTracking: () => {

        if (getConfig(CONST.CONFIG.GENERAL, CONST.CONFIG.PROPS.FILE_TRACKING)) {
            fileTracking = vscode.window.createOutputChannel("DCU FILE TRACKING");
            fileTracking.appendLine(`********* SESIÓN INICIADA A LAS: ${new Date().getHours()}:${new Date().getMinutes()}hs. **********`);
        }
    },

    /**
     * 
     * @param {DcuItemBar} item 
     * @param {Object} env
     * @param {Function} success
     * @param {Function} error
     * @param {Object} replacementData
     */
    runCommand: function (item, env, replacementData, success, fail) {
        let API = this;
        if (!env) {
            env = API.findEnvironment();
        }
        replacementData.envName = env.env;
        if (true) { //setting.log.showNotifications
            API.info({
                msg: item.MSGS.START,
                replace: replacementData
            });
        }
        log({
            section: item.itemBar.tooltip,
            title: replace(item.MSGS.START, replacementData),
            detail: `COMMAND: \n ${item.task} \n`
        });

        item.toggleSpinIcon();
        cmd.run(`cd "${env.basePath}" & ${item.task}`, function (error, data, stderr) {
            var taskInfo = analizeResponse({
                data: data,
                error: error,
                sterror: stderr
            });

            if (taskInfo.STATUS == CONST.STATUS.SUCCESS) {
                let detail = `***INFO*** \n ${taskInfo[CONST.MGS_TYPES.INFO]} \n ************* \n `;
                if (taskInfo[CONST.MGS_TYPES.WARN]) {
                    detail += ` \n ***WARNING*** \n ${taskInfo[CONST.MGS_TYPES.WARN]} \n ************* \n `;
                }
                log({
                    section: null,
                    title: replace(item.MSGS.SUCCESS, replacementData),
                    detail: detail
                });

                API.info({
                    msg: item.MSGS.SUCCESS,
                    replace: replacementData
                });
                item.success();

                //FILE TRACKING
                if (fileTracking) {
                    fileTracking.appendLine(replace(item.MSGS.TRACKING, replacementData));
                    fileTracking.appendLine("");
                }

                if (success && typeof success === "function") {
                    success(taskInfo);
                }
            } else if (taskInfo.STATUS == CONST.STATUS.FAIL) {
                let detail = "";
                if (taskInfo[CONST.MGS_TYPES.WARN]) {
                    detail += ` \n ***WARNING*** \n ${taskInfo[CONST.MGS_TYPES.WARN]} \n ************* \n `;
                }

                detail += `***ERROR*** \n ${taskInfo[CONST.MGS_TYPES.ERROR]} \n ************* \n `;

                log({
                    section: null,
                    title: replace(item.MSGS.ERROR, replacementData),
                    detail: detail
                });


                API.error({
                    msg: item.MSGS.ERROR,
                    replace: replacementData
                });
                item.fail();

                if (fail && typeof fail === "function") {
                    fail(taskInfo);
                }
            }


            log({ section: `END ${item.itemBar.tooltip}`, title: null, detail: null });
        });
    },

    validateVersion: function (STORAGE) {
        let dcu = this;
        let currentVersion = vscode.extensions.getExtension('CrisJF.dcu-utils').packageJSON.version;
        let localVersion = STORAGE.get(CONST.STORAGE.VERSION);
        let lastVersion;
        let lastRelease = CONST.VERSIONS.RELEASES[CONST.VERSIONS.RELEASES.length - 1];

        if (utils.compare(localVersion, currentVersion) == 0) return;

        if (!STORAGE.get(CONST.STORAGE.VERSION) || utils.compare(localVersion, currentVersion) == -1) {
            lastVersion = CONST.VERSIONS.ALL[CONST.VERSIONS.ALL.length - 1];
            STORAGE.update(CONST.STORAGE.VERSION, currentVersion);
        }
        if (lastVersion.TYPE === "R") {
            if (dcu.getConfig(CONST.CONFIG.GENERAL, CONST.CONFIG.PROPS.NOTIFY_UPDATES) === CONST.PREGUNTAR) {
                dcu.info({
                    msg: "¿Quieres ver las mejoras de la versión " + currentVersion + "?",
                    items: [CONST.SI, CONST.NO],
                    callback: (response) => {
                        if (response === CONST.SI) {
                            vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=CrisJF.dcu-utils#' + lastVersion.id));
                        }
                    }
                });
            }
            else if (dcu.getConfig(CONST.CONFIG.GENERAL, CONST.CONFIG.PROPS.NOTIFY_UPDATES) === CONST.SIEMPRE) {
                vscode.window.showInformationMessage(`Hey! Mirá las novedades de DCU UTILS`);
                setTimeout(() => {
                    vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=CrisJF.dcu-utils#' + lastVersion.id));
                }, 3000);
            }
        } else if (lastVersion.TYPE === "F") {
            dcu.info({
                msg: "Actualizamos DCU UTILS a la version " + currentVersion + " para corregir algunos errores. \n ¿Quieres ver las mejoras del release " + lastRelease.V + "?",
                items: [CONST.SI, CONST.NO],
                callback: (response) => {
                    if (response === CONST.SI) {
                        vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=CrisJF.dcu-utils#' + lastRelease.id));
                    }
                }
            });
        }
    }
};
