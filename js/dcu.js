const vscode = require('vscode');
const fs = require('fs');
// const { callbackify } = require('util');
// const { isOptionalChain } = require('typescript');
// const { createClassifier } = require('typescript');
// const { env } = require('process');
const output = vscode.window.createOutputChannel("DCU INFO");
const CONST = {
    VALID_PATHS: ["element", "global", "snippets", "theme", "widget"],
    COMPONENTS: {
        WIDGET: "widget",
        GLOBAL: "global",
        THEME: "theme",
        ELEM: "element",
        SNIPPET: "snippets"
    },
    MSGS: {
        GRAB_START: "Iniciando grab de @@envName@@...",
        GRAB_OK: "Código descargado correctamente",
        GRAB_ERROR: "Error descargando código de @@envName@@",
        PUT_START: "Subiendo @@fileName@@...",
        PUT_OK: "@@fileName@@ subido correctamente",
        PUT_ERROR: "Error subiendo el archivo @@fileName@@",
        PUT_ALL_START: "Subiendo @@componentName@@...",
        PUT_ALL_OK: "@@componentName@@ subido correctamente",
        PUT_ALL_ERROR: "Error subiendo los archivos de @@componentName@@",
        REFRESH_STRAT: "Actualizando @@componentName@@...",
        REFRESH_OK: "@@componentName@@ actualizado correctamente",
        REFRESH_ERROR: "Error actualizando @@componentName@@",
        TRANSFER_START: "Enviando @@componentName@@ a @@destEnv@@...",
        TRANSFER_OK: "@@componentName@@ enviado a @@destEnv@@ correctamente",
        TRANSFER_ERROR: "Error enviando @@componentName@@ a @@destEnv@@",
        PLSU_START: "Clonando @@layoutName@@ en @@destEnv@@...",
        PLSU_OK: "@@layoutName@@ actualizado correctamente en @@destEnv@@",
        PLSU_ERROR: "Error actualizando @@layoutName@@ en @@destEnv@@"
    },
    MGS_TYPES: {
        INFO: "INFO",
        SUCCESS: "INFO",
        WARN: "WARN",
        ERROR: "ERROR"
    },
    ENV: {
        DEV: "DEV",
        TEST: "TEST",
        STAGE: "STAGE",
        PROD: "PROD",
        ALL: ["DEV", "TEST", "STAGE", "PROD"]
    },
    CONFIG: {
        GENERAL: "dcu.general",
        DEV: "dcu.dev",
        TEST: "dcu.test",
        STAGE: "dcu.stage",
        PROD: "dcu.prod",
        PROPS: {
            UPDATE_ALL_INSTANCES: "updateAllInstances",
            IGNORE_COMMERCE_VERSION: "ignoreCommerceVersion",
            ENVIROMENT_URL: "enviromentUrl",
            APP_KEY: "key",
            FOCUS_ON_WARN: "focusOnWarn"
        }
    },
    EDITORS: {
        LOG: "Log"
    }
};

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
        envUrl: ""
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
    env.envUrl = envConfig.node;
    env.occVersion = envConfig.commerceCloudVersion;
    env.dcuVersion = envConfig.packageVersion;

    switch (envConfig.node) {
        case getConfig(CONST.CONFIG.DEV, CONST.CONFIG.PROPS.ENVIROMENT_URL):
            env.settings = CONST.CONFIG.DEV;
            env.env = CONST.ENV.DEV
            break;
        case getConfig(CONST.CONFIG.TEST, CONST.CONFIG.PROPS.ENVIROMENT_URL):
            env.settings = CONST.CONFIG.TEST;
            env.env = CONST.ENV.TEST
            break;
        case getConfig(CONST.CONFIG.STAGE, CONST.CONFIG.PROPS.ENVIROMENT_URL):
            env.settings = CONST.CONFIG.STAGE;
            env.env = CONST.ENV.STAGE
            break;
        case getConfig(CONST.CONFIG.PROD, CONST.CONFIG.PROPS.ENVIROMENT_URL):
            env.settings = CONST.CONFIG.PROD;
            env.env = CONST.ENV.PROD
            break;
    }

    env.key = getConfig(env.settings, CONST.CONFIG.PROPS.APP_KEY);
    return env;


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

function putMessage(opt) {
    let msg = replace(opt.msg, opt.replaceOptions || opt.replace);

    output.appendLine(`*****${opt.type}*****`);
    output.appendLine(msg);
    let str = "";

    for (let index = 0; index < msg.length; index++) {
        str += "‾";
    }
    output.appendLine(str);
    if (opt.detail) output.appendLine(opt.detail);
    output.appendLine(`*****/${opt.type}*****`);

    switch (opt.type) {
        case CONST.MGS_TYPES.INFO || CONST.MGS_TYPES.SUCCESS:
            if (opt.items && opt.callback) {
                vscode.window.showInformationMessage(msg, opt.items[0], opt.items[1], opt.items[2]).then(function (response) {
                    if (response) {
                        opt.callback(response);
                    }
                });
            } else {
                vscode.window.showInformationMessage(msg);
            }
            break;
        case CONST.MGS_TYPES.WARN:
            if (opt.items && opt.callback) {
                vscode.window.showWarningMessage(msg, opt.items[0], opt.items[1], opt.items[2]).then(function (response) {
                    if (response) {
                        opt.callback(response);
                    }
                });
            } else {
                vscode.window.showWarningMessage(msg);
            }
            if (getConfig(CONST.CONFIG.GENERAL, CONST.CONFIG.PROPS.FOCUS_ON_WARN) && opt.detail) {
                output.show();
            }
            break;
        case CONST.MGS_TYPES.ERROR:
            if (opt.items && opt.callback) {
                vscode.window.showErrorMessage(msg, opt.items[0], opt.items[1], opt.items[2]).then(function (response) {
                    if (response) {
                        opt.callback(response);
                    }
                });
            } else {
                vscode.window.showErrorMessage(msg);
            }
            if (opt.detail) {
                output.show();
            }
            break;
    }
}

module.exports = {
    CONST: CONST,
    error: function (options) {
        if (typeof options === "string") {
            options = {
                msg: options
            };
        }
        options.msg = CONST.MSGS[options.msg] ? CONST.MSGS[options.msg] : options.msg;
        options.type = CONST.MGS_TYPES.ERROR;
        putMessage(options);
    },
    info: function (options) {
        if (typeof options === "string") {
            options = {
                msg: options
            };
        }
        options.msg = CONST.MSGS[options.msg] ? CONST.MSGS[options.msg] : options.msg;
        options.type = CONST.MGS_TYPES.INFO;
        putMessage(options);
    },
    success: function (options) {
        if (typeof options === "string") {
            options = {
                msg: options
            };
        }
        options.msg = CONST.MSGS[options.msg] ? CONST.MSGS[options.msg] : options.msg;
        options.type = CONST.MGS_TYPES.INFO;
        putMessage(options);
    },
    warn: function (options) {
        if (typeof options === "string") {
            options = {
                msg: options
            };
        }
        options.msg = CONST.MSGS[options.msg] ? CONST.MSGS[options.msg] : options.msg;
        options.type = CONST.MGS_TYPES.WARN;
        putMessage(options);
    },

    findEnvironment: findEnvironment,
    getConfig: getConfig,
    showOutput: function () {
        output.show();
    }

};