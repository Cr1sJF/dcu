const vscode = require("vscode");
const DcuItem = require("./js/models/DcuItemBar");
const Environment = require("./js/models/Environment");
const Command = require("./js/models/Command");
const ThirdParty = require("./js/models/thirdParty");
const SSE = require("./js/models/SSE");
const CCW = require("./js/models/CCW");
const PLSU = require("./js/models/PLSU");

const dcu = require("./js/controllers/dcu");
const CONSTANTS = require("./js/CONS/CONSTANTS.json");
const TEXTS = require("./js/CONS/TEXTS.json");
const infoRequest = require("./js/controllers/infoRequest");
const logger = require("./js/controllers/logger");
const utils = require("./js/utils");
const copyPaste = require("copy-paste");
const fs = require("fs");

let isRunningCommand = false;
let STORAGE;

const buttons = {
	test: new DcuItem({
		command: "dcu.test",
		icon: "callstack-view-session",
		hidden: true,
		tooltip: "",
		type: CONSTANTS.ITEM_TYPES.DOWNLOAD,
		msg: {
			start: TEXTS.MSGS.GRAB_START,
			success: TEXTS.MSGS.GRAB_OK,
			error: TEXTS.MSGS.GRAB_ERROR,
			trackingMsg: "Descargaste el ambiente @@envName@@",
			warn: "",
		},
	}),
	more: new DcuItem({
		command: "occ.more",
		icon: "more",
		tooltip: "Más acciones",
		type: null,
		msg: {
			start: "",
			success: "",
			error: "",
			trackingMsg: "",
			warn: "",
		},
	}),
	grab: new DcuItem({
		command: "dcu.grab",
		icon: "extensions-install-count",
		tooltip: "Descargar ambiente",
		hidden: true,
		type: CONSTANTS.ITEM_TYPES.DOWNLOAD,
		msg: {
			start: TEXTS.MSGS.GRAB_START,
			success: TEXTS.MSGS.GRAB_OK,
			error: TEXTS.MSGS.GRAB_ERROR,
			trackingMsg: "Descargaste el ambiente @@envName@@",
			warn: "",
		},
	}),
	updateWidget: new DcuItem({
		command: "dcu.e",
		icon: "extensions-sync-enabled",
		tooltip: "Actualizar Widget",
		type: CONSTANTS.ITEM_TYPES.DOWNLOAD,
		msg: {
			start: TEXTS.MSGS.REFRESH_STRAT,
			success: TEXTS.MSGS.REFRESH_OK,
			error: TEXTS.MSGS.REFRESH_ERROR,
			trackingMsg: "Descargaste de @@envName@@: \n@@componentName@@",
			warn: "",
		},
	}),
	putFile: new DcuItem({
		command: "dcu.t",
		icon: "chevron-up",
		tooltip: "Subir archivo",
		type: CONSTANTS.ITEM_TYPES.UPLOAD,
		msg: {
			start: TEXTS.MSGS.PUT_START,
			success: TEXTS.MSGS.PUT_OK,
			error: TEXTS.MSGS.PUT_ERROR,
			trackingMsg: "Subiste a @@envName@@: \n@@fileName@@",
			warn: "",
		},
	}),
	putFolder: new DcuItem({
		command: "dcu.m",
		icon: "fold-up",
		tooltip: "Subir Widget",
		type: CONSTANTS.ITEM_TYPES.UPLOAD,
		msg: {
			start: TEXTS.MSGS.PUT_ALL_START,
			success: TEXTS.MSGS.PUT_ALL_OK,
			error: TEXTS.MSGS.PUT_ALL_ERROR,
			trackingMsg: "Subiste a @@envName@@: \n@@componentName@@",
			warn: "",
		},
	}),
	transferFile: new DcuItem({
		command: "dcu.r",
		icon: "run",
		tooltip: "Migrar archivo",
		type: CONSTANTS.ITEM_TYPES.MIGRATION,
		msg: {
			start: TEXTS.MSGS.TRANSFER_START,
			success: TEXTS.MSGS.TRANSFER_OK,
			error: TEXTS.MSGS.TRANSFER_ERROR,
			trackingMsg: "Migraste a @@destEnv@@: \n@@componentName@@",
			warn: "",
		},
	}),
	transferFolder: new DcuItem({
		command: "dcu.x",
		icon: "run-all",
		tooltip: "Migrar Widget",
		type: CONSTANTS.ITEM_TYPES.MIGRATION,
		msg: {
			start: TEXTS.MSGS.TRANSFER_START,
			success: TEXTS.MSGS.TRANSFER_OK,
			error: TEXTS.MSGS.TRANSFER_ERROR,
			trackingMsg: "Migraste a @@destEnv@@: \n@@componentName@@",
			warn: "",
		},
	}),
	migrateLayout: new DcuItem({
		command: "plsu.y",
		icon: "references",
		tooltip: "Migrar Layout",
		hidden: true,
		type: CONSTANTS.ITEM_TYPES.MIGRATION,
		msg: {
			start: TEXTS.MSGS.PLSU_START,
			success: TEXTS.MSGS.PLSU_OK,
			error: TEXTS.MSGS.PLSU_ERROR,
			trackingMsg: "Migraste a @@destEnv@@: \n@@layoutName@@",
			warn: "",
		},
	})
};

const functions = {

	//#region  DCU
	grab: async (externalFile) => {
		try {
			let folder;
			let path;
			if (externalFile) {
				path = externalFile.path;
			} else {
				let useInternalFolders = await dcu.evaluateConfig(CONSTANTS.CONFIG.DCU.NAME, CONSTANTS.CONFIG.DCU.PROPS.INTERNAL_FOLDERS_ON_GRAB);

				if(useInternalFolders){
					folder = await infoRequest.pickInternalFolder();
				}else{
					folder = await infoRequest.pickFolder(TEXTS.GRAB.PICK_GRAB_FOLDER); //TODO MOVE AS CONSTANT
					if (!folder) return;
					
				}
				
				path = typeof folder == "string" ? folder : folder[0].path;

			}

			let environment = await dcu.pickEnv();
			if (environment.errorFlag) {
				logger.logError(environment.errorMsg);
				return;
			}

			environment.basePath = utils.cleanPath(path);

			let command = new Command({
				name: TEXTS.GRAB.GRAB_TASK,
				itemBar: buttons.more,
				messages: buttons.grab.MSGS,
				cwd: utils.cleanPath(externalFile ? externalFile.path : path),
				task: `dcu -g -c -n ${environment.node.toString()} -k ${environment.key}`,
				env: environment
			});

			command.registerMessages({
				envName: environment.env,
			});

			command.exec();
		} catch (e) {
			logger.postError({
				source: "dcu.g",
				error: e.message,
				stack: e.stack,
			});
		}
	},

	updateWidget: async (externalFile) => {
		try {
			let env = new Environment(externalFile, "FOLDER");
			let component, task;
			if (!env.errorFlag) {
				component = await dcu.getComponent(externalFile);
				if (!component) return;

				task = `dcu -e "${component.relativePath}" -k ${env.key}`;
			} else {
				let folder = await infoRequest.pickEnvironmentFolder();
				if (!folder) return;

				// env = dcu.getEnvironmentInfo(folder);
				env = folder.environment;
				if (!env) return;

				component = await dcu.getComponentFromFolder(folder);
				if (!component) return;

				task = `dcu -e "${component.relativePath}" -k ${env.key}`;
			}

			let command = new Command({
				itemBar: buttons.updateWidget,
				messages: buttons.updateWidget.MSGS,
				name: TEXTS.UPDATE_COMPONENT.UPDATE_COMPONENT_TASK,
				task: task,
				env: env
			});
			command.registerMessages({
				componentName: component.componentName,
				envName: env.env
			});
			command.exec();
		} catch (e) {
			logger.postError({
				source: "dcu.e",
				error: e.message,
				stack: e.stack,
			});
			return;
		}
	},

	putFile: async (externalFile) => {
		try {
			let doc = infoRequest.getOpenEditor();
			if (!doc && !externalFile) {
				logger.logError(TEXTS.ERRORS.NO_FILE_OPEN, logger.LOG);
				return;
			}

			let env = await dcu.getEnvironment(externalFile);
			if (!env) return;

			let component = await dcu.getComponent(externalFile);
			if (!component) return;

			let updateAll = await dcu.evaluateConfig(CONSTANTS.CONFIG.DCU.NAME, CONSTANTS.CONFIG.DCU.PROPS.UPDATE_ALL_INSTANCES, component.instanciable);
			if (updateAll === undefined) return;

			let command = new Command({
				name: TEXTS.PUT_FILE.PUT_FILE_TASK,
				itemBar: buttons.putFile,
				messages: buttons.putFile.MSGS,
				env: env,
				task: `dcu ${updateAll ? "-i " : ""} -t "${component.path}" -k ${env.key}`
			});

			command.registerMessages({
				componentName: component.componentName,
				envName: env.env,
				fileName: component.fileName
			});
			command.exec();
		} catch (e) {
			logger.postError({
				source: "dcu.t",
				error: e.message,
				stack: e.stack,
			});
		}
	},

	putFolder: async (externalFile) => {
		try {
			let componentPath;
			let doc = infoRequest.getOpenEditor();
			if (!doc && !externalFile) {
				let folder = await infoRequest.pickEnvironmentFolder();
				if (!folder) return;

				componentPath = await dcu.getComponentPath(folder);
				if (!componentPath) return;
			}

			let env = await dcu.getEnvironment(externalFile || componentPath);
			if (!env) return;

			let component = await dcu.getComponent(externalFile || componentPath);
			if (!component) return;

			let command = new Command({
				name: TEXTS.PUT_FOLDER.PUT_FOLDER_TASK,
				itemBar: buttons.putFolder,
				messages: buttons.putFile.MSGS,
				env: env,
				task: `dcu -m "${component.relativePath}" -k ${env.key}`
			});

			command.registerMessages({
				componentName: component.componentName,
				envName: env.env
			});
			command.exec();
		} catch (e) {
			logger.postError({
				source: "dcu.m",
				error: e.message,
				stack: e.stack,
			});
		}
	},

	transferFile: async (externalFile) => {
		try {
			let doc = infoRequest.getOpenEditor();
			if (!doc && !externalFile) {
				logger.logError(TEXTS.ERRORS.NO_FILE_OPEN, logger.LOG);
				return;
			}

			let env = await dcu.getEnvironment(externalFile);
			if (!env) return;

			let component = await dcu.getComponent(externalFile);
			if (!component) return;

			let destEnv = await dcu.getDestination(env.env);
			if (!destEnv) return;

			let command = new Command({
				name: TEXTS.TRANSFER_FILE.TRANSFER_FILE_TASK,
				itemBar: buttons.transferFile,
				messages: buttons.transferFile.MSGS,
				env: env,
				task: `dcu -n ${destEnv.node} -k ${destEnv.key} -r "${component.path}"`
			});

			command.registerMessages({
				componentName: component.componentName,
				destEnv: destEnv.env,
			});
			command.exec();
		} catch (e) {
			logger.postError({
				source: "dcu.r",
				error: e.message,
				stack: e.stack,
			});
		}
	},

	transferFolder: async (externalFile) => {
		try {
			let componentPath;
			let doc = infoRequest.getOpenEditor();
			if (!doc && !externalFile) {
				let folder = await infoRequest.pickEnvironmentFolder();

				componentPath = await dcu.getComponentPath(folder);
				if (!componentPath) return;
			}

			let env = await dcu.getEnvironment(externalFile || componentPath);
			if (!env) return;

			let component = await dcu.getComponent(externalFile || componentPath);
			if (!component) return;

			let destEnv = await dcu.getDestination(env.env);
			if (!destEnv) return;

			let migrateConfig = component.isConfigurable ? await dcu.evaluateConfig(CONSTANTS.CONFIG.DCU.NAME, CONSTANTS.CONFIG.DCU.PROPS.MIGRATE_CONFIGS) : false;
			if (migrateConfig === undefined) return;

			let command = new Command({
				name: TEXTS.TRANSFER_FOLDER.TRANSFER_FOLDER_TASK,
				itemBar: buttons.transferFolder,
				messages: buttons.transferFolder.MSGS,
				env: env,
				task: `dcu -n ${destEnv.node} -k ${destEnv.key} -x "${component.relativePath}" ${component.isConfigurable && !migrateConfig ? " -o" : ""}`
			});

			command.registerMessages({
				componentName: component.componentName,
				envName: env.env,
				destEnv: destEnv.env
			});
			command.exec();
		} catch (e) {
			logger.postError({
				source: "dcu.m",
				error: e.message,
				stack: e.stack,
			});
		}
	},

	//#endregion DCU

	//#region  PLSU
	migrateLayouts: async () => {
		try {
			let widgetsMigrated = await infoRequest.askTroughNotification({
				msg: TEXTS.TRANSFER_LAYOUT.WARNING_MIGRATE_WIDGETS,
				options: [CONSTANTS.CONTINUAR, CONSTANTS.CANCELAR],
				type: CONSTANTS.MGS_TYPES.WARN,
			});

			if (!widgetsMigrated || widgetsMigrated == CONSTANTS.CANCELAR) return;

			let origin = await dcu.getOrigin();
			if (!origin) return;

			let dest = await dcu.getDestination(origin.env);
			if (!dest) return;

			let plsu = new PLSU({
				name: TEXTS.TRANSFER_LAYOUT.TRANSFER_LAYOUTS_TASK,
				destination: dest,
				origin: origin,
				env: origin,
				itemBar: buttons.more,
				messages: buttons.migrateLayout.MSGS,
				ignoreCommerceVersion: await dcu.evaluateConfig(CONSTANTS.CONFIG.PLSU.NAME, CONSTANTS.CONFIG.PLSU.PROPS.IGNORE_COMMERCE_VERSION)
			});

			await plsu.selectLayouts();
			let msgLayoutName = plsu.buildCommand();

			plsu.registerMessages({
				layoutName: msgLayoutName,
				destEnv: dest.env,
			});

			if (plsu.errorFlag) return;

			await plsu.exec();
		} catch (e) {
			logger.postError({
				source: "plsu.y",
				error: e.message,
				stack: e.stack,
			});
		}
	},

	//#endregion PLSU

	//#region CCW
	createWidget: async (externalFile) => {
		try {
			let env;
			if (!externalFile) {
				let folder = await infoRequest.pickEnvironmentFolder();
				if (!folder) return;

				env = await dcu.getEnvironment(folder);
				if (!env) return;
			} else {
				env = await dcu.getEnvironment(externalFile);
			}

			let widgetName = await infoRequest.showInputBox(TEXTS.WIDGET_CREATION.INPUT_WIDGET_NAME);
			if (!widgetName) return;

			let useElements = await infoRequest.boolQuickPick(TEXTS.WIDGET_CREATION.REQUIRE_ELEMENTS);
			if (useElements == undefined) return;

			let locales = [];
			let localeConfig = utils.getConfig(CONSTANTS.CONFIG.CCW.NAME, CONSTANTS.CONFIG.CCW.PROPS.WIDGET_LANGUAGES);

			if (localeConfig == CONSTANTS.PREGUNTAR) {
				locales = await infoRequest.quickPickMany(CONSTANTS.LOCALE_LIST, TEXTS.WIDGET_CREATION.CHOOSE_LOCALES);
			} else if (localeConfig == CONSTANTS.TODOS) {
				locales = CONSTANTS.LOCALE_LIST;
			} else {
				locales = CONSTANTS.LOCALE_LIST_BASIC;
			}

			let command = new CCW(
				{
					itemBar: buttons.more,
					env: env,
					cwd: env.basePath,
					widgetName: widgetName,
					langs: locales,
					useElements: useElements,
					name: TEXTS.WIDGET_CREATION.WIDGET_CREATION_TASK,
					messages: {
						start: TEXTS.WIDGET_CREATION.WIDGET_CREATION_START,
						success: TEXTS.WIDGET_CREATION.WIDGET_CREATION_SUCCESS,
						error: TEXTS.WIDGET_CREATION.WIDGET_CREATION_FAIL
					},
				}
			);

			await command.createWidget();
		} catch (e) {
			logger.postError({
				source: "ccw.createWidget",
				error: e.message,
				stack: e.stack,
			});
		}
	},
	//#endregion CCW

	//#region MORE
	copyKey: async () => {
		try {
			let env = await dcu.pickEnv();
			copyPaste.copy(env.key);
			logger.logAndForceNotification(TEXTS.MORE_FN.KEY_COPPIED, logger.LOG);
		} catch (e) {
			logger.postError({
				source: "copyKey",
				error: e.message,
				stack: e.stack,
			});
			return;
		}
	},

	copyNode: async () => {
		try {
			let env = await dcu.pickEnv();
			copyPaste.copy(env.node.toString());
			logger.logAndForceNotification(TEXTS.MORE_FN.URL_COPPIED, logger.LOG);
		} catch (e) {
			logger.postError({
				source: "copyNode",
				error: e.message,
				stack: e.stack,
			});
			return;
		}
	},

	feedback: async () => {
		try {
			let type = await infoRequest.quickPick(CONSTANTS.FEEDBACK_TYPES.ALL, TEXTS.MORE_FN.CHOOSE_FEEDBACK);
			if (!type) return;

			let msg = await infoRequest.showInputBox(TEXTS.MORE_FN.MESSAGE);
			if (!msg) return;

			logger.sendFeedback(msg, type);
		} catch (e) {
			logger.postError({
				source: "feedback",
				error: e.message,
				stack: e.stack,
			});
			return;
		}
	},

	extractLoacales: async (externalFile) => {
		return new Promise(async (resolve, reject) => {
			try {
				// if (checkRunningStatus()) {
				// 	isRunningCommand = true;
				let env = new Environment(externalFile, "FOLDER");
				if (env.errorFlag) return;

				let component;
				component = await dcu.getComponent(externalFile);
				if (component.fileName != "configMetadata.json") {
					logger.logError(TEXTS.ERRORS.SNIPPET_EXTRACTION_WRONG_FILE);
					reject(false);
					return;
				}
				let doc = infoRequest.getFileContent(externalFile);

				//Busco y obtengo los locales del archivo de config
				let configFile = JSON.parse(doc);
				let locales = [];
				for (var i in configFile.properties) {
					locales.push(configFile.properties[i].helpTextResourceId);
					locales.push(configFile.properties[i].labelResourceId);
				}

				//Elimino los duplicados
				locales = Array.from(new Set(locales));
				let newLocales = {
					resources: {}
				};
				locales.forEach(function (locale) {
					newLocales.resources[locale] = "";
				});

				const localesFolder = utils.readDir(component.componentAbsolutePath + "/config/locales");

				localesFolder.children.forEach(async (localeFile) => {
					let contentToWrite;
					let currentContent = utils.readFile(localeFile.path);
					if (currentContent) {
						let currentLocales = JSON.parse(currentContent);
						let mergedLocales = {
							resources: {}
						};
						mergedLocales.resources = Object.assign({}, newLocales.resources, currentLocales.resources);

						contentToWrite = JSON.stringify(mergedLocales);
					} else {
						contentToWrite = JSON.stringify(newLocales);
					}

					fs.writeFileSync(localeFile.path, contentToWrite);
				});

				await utils.formatAll(component.componentAbsolutePath + "/config/locales");
				// await vscode.commands.executeCommand("workbench.action.files.saveAll");
				resolve(true);
			} catch (e) {
				isRunningCommand = false;
				reject(JSON.stringify(e));
			}
		})
	},
	//#endregion MORE

	//#region  THIRDPARTY
	uploadThirdPartyFile: async (externalFile) => {
		try {
			let env;

			let file = await infoRequest.pickFile();
			if (!file) return;

			if (!externalFile) {
				let folder = await infoRequest.pickEnvironmentFolder();
				if (!folder) return;

				env = await dcu.getEnvironment(folder);
				if (!env) return;
			} else {
				env = await dcu.getEnvironment(externalFile);
			}
			let fileName;
			let useFileName = await dcu.evaluateConfig(CONSTANTS.CONFIG.THIRD_PARTY.NAME, CONSTANTS.CONFIG.THIRD_PARTY.PROPS.USE_ZIP_NAME);
			if (useFileName) {
				fileName = file.path.substring(file.path.lastIndexOf("/") + 1);
			} else {
				fileName = await infoRequest.showInputBox(TEXTS.THIRD_PARTY.INPUT_FILE_NAME);
				if (fileName == undefined) return;

				fileName = fileName || file.path.substring(file.path.lastIndexOf("/") + 1);
			}

			let siteId = await dcu.getOccSite(env);

			let thirdParty = new ThirdParty({
				env: env,
				itemBar: buttons.more,
				path: file.path,
				fileName: fileName,
				base64: utils.convertToBase64(file.path),
				site: siteId,
				name: TEXTS.THIRD_PARTY.UPLOAD_FILE_TASK,
				messages: {
					start: TEXTS.THIRD_PARTY.UPLOAD_FILE_START,
					success: TEXTS.THIRD_PARTY.UPLOAD_FILE_SUCCESS,
					error: TEXTS.THIRD_PARTY.UPLOAD_FILE_FAIL,
					trackingMsg: TEXTS.THIRD_PARTY.UPLOAD_FILE_TRACKING,
				}
			});

			await thirdParty.upload();
			isRunningCommand = false;

		} catch (e) {
			logger.postError({
				source: "dcu.uploadThirdPartyFile",
				error: e.message,
				stack: e.stack,
			});
		}
	},

	deleteThirdPartyFiles: async (externalFile) => {
		try {
			let env;

			if (!externalFile) {
				let folder = await infoRequest.pickEnvironmentFolder();
				if (!folder) return;

				env = await dcu.getEnvironment(folder);
				if (!env) return;
			}

			let siteId = await dcu.getOccSite(env);
			let thirdParty = new ThirdParty({
				env: env,
				itemBar: buttons.more,
				site: siteId,
				name: TEXTS.THIRD_PARTY.DELETE_FILE_TASK,
				messages: {
					start: TEXTS.THIRD_PARTY.DELETE_FILE_START,
					success: TEXTS.THIRD_PARTY.DELETE_FILE_SUCCESS,
					error: TEXTS.THIRD_PARTY.DELETE_FILE_FAIL,
					trackingMsg: TEXTS.THIRD_PARTY.DELETE_FILE_TRACKING,
				}
			});

			await thirdParty.delete();
			isRunningCommand = false;
		} catch (e) {

		}
	},
	//#endregion THIRDPARTY

	//#region SSE

	uploadSSE: async (externalFile) => {
		try {
			let env = await dcu.pickEnv();

			let zip;
			if (externalFile) {
				zip = externalFile;
			} else {
				zip = await infoRequest.pickFile(TEXTS.SSE.INPUT_SSE_FILE, {
					zip: ["zip"]
				});
			}

			let sseName;

			let useZipName = await dcu.evaluateConfig(CONSTANTS.CONFIG.SSE.NAME, CONSTANTS.CONFIG.SSE.PROPS.USE_ZIP_NAME);
			if (useZipName) {
				sseName = zip.path.substring(zip.path.lastIndexOf("/") + 1);
			} else {
				sseName = await infoRequest.showInputBox(TEXTS.SSE.INPUT_SSE_NAME);
				if (!sseName) {
					if (sseName == "") {
						sseName = zip.path.substring(zip.path.lastIndexOf("/") + 1);
					}
					else {
						return;
					}
				}
			}

			let sse = new SSE({
				env: env,
				itemBar: buttons.more,
				name: sseName,
				messages:{
					error: "Error subiendo la SSE",
					start: "Subiendo SSE...",
					success: "SSE Subida correctamente",
					trackingMsg: `Subiste ${sseName} a ${env.env}`
				},
				zip
			});



			if (sse.errorFlag) {
				logger.logError(sse.errorMsg);
				return
			}

			sse.upload();
		} catch (e) {

		}
	},
	downloadSSE: async () => {
		try {
			let folder = await infoRequest.pickFolder(TEXTS.SSE.CHOOSE_DOWNLOAD_FOLDER);
			if (!folder) return;

			let env = await dcu.pickEnv();
			if (env.errorFlag) {
				logger.logError(env.errorMsg);
				return;
			}

			let sse = new SSE({
				env: env,
				itemBar: buttons.more
			});

			let sseList = await sse.fetchSSE();
			let selectedSSE = await infoRequest.quickPick(sseList, TEXTS.SSE.CHOOSE_DOWNLOAD_SSE);

			sse.downloadSSE(selectedSSE, utils.cleanPath(folder[0].path));
		} catch (e) {

		}
	},
	deleteSSE: async () => {
		try {
			let env = await dcu.pickEnv();
			if (env.errorFlag) {
				logger.logError(env.errorMsg);
				return;
			}

			let sse = new SSE({
				env: env,
				itemBar: buttons.more,

			});

			let sseList = await sse.fetchSSE();
			let selectedSSE = await infoRequest.quickPick(sseList, TEXTS.SSE.CHOOSE_SSE_TO_DELETE);
			if (!selectedSSE) return;

			sse.delete(selectedSSE);

		} catch (e) {

		}
	}

	//#endregion SSE
};

const checkRunningStatus = () => {
	if (isRunningCommand) {
		logger.logInfo("Aún esta corriendo otro proceso");
		return false;
	}

	return true;
}

const registerCommands = () => {
	try {


		vscode.commands.registerCommand("dcu.test", async () => {
			try {

			} catch (e) {

			}
		});

		vscode.commands.registerCommand("dcu.e", async (externalFile) => {
			functions.updateWidget(externalFile);
		});

		vscode.commands.registerCommand("dcu.grab", async (externalFile) => {
			functions.grab(externalFile);
		});

		vscode.commands.registerCommand("dcu.t", async (externalFile) => {
			functions.putFile(externalFile);
		});

		vscode.commands.registerCommand("dcu.m", async (externalFile) => {
			functions.putFolder(externalFile);
		});

		vscode.commands.registerCommand("dcu.r", async (externalFile) => {
			functions.transferFile(externalFile);
		});

		vscode.commands.registerCommand("dcu.x", async (externalFile) => {
			functions.transferFolder(externalFile);
		});

		vscode.commands.registerCommand("plsu.y", async () => {
			functions.migrateLayouts();
		});

		vscode.commands.registerCommand("ccw.w", async (externalFile) => {
			functions.createWidget(externalFile);
		});

		vscode.commands.registerCommand("occ.u", async () => {
			functions.uploadThirdPartyFile();
		});

		vscode.commands.registerCommand("occ.d", async () => {
			functions.deleteThirdPartyFiles();
		});

		vscode.commands.registerCommand("occ.k", async () => {
			functions.copyKey();
		});

		vscode.commands.registerCommand("occ.n", async () => {
			functions.copyNode();
		});

		vscode.commands.registerCommand("occ.f", async () => {
			functions.feedback();
		});

		vscode.commands.registerCommand("occ.l", async (externalFile) => {
			functions.extractLoacales(externalFile);
		});

		vscode.commands.registerCommand("occ.s", async (externalFile) => {
			functions.uploadSSE(externalFile);
		});

		vscode.commands.registerCommand("occ.more", async () => {
			try {
				const actions = {};
				actions[CONSTANTS.ACTIONS.PLSU] = functions.migrateLayouts;
				actions[CONSTANTS.ACTIONS.CCW] = functions.createWidget;
				actions[CONSTANTS.ACTIONS.THIRD] = functions.uploadThirdPartyFile;
				actions[CONSTANTS.ACTIONS.DEL_THIRD] = functions.deleteThirdPartyFiles;
				actions[CONSTANTS.ACTIONS.GRAB] = functions.grab;
				actions[CONSTANTS.ACTIONS.KEY] = functions.copyKey;
				actions[CONSTANTS.ACTIONS.NODE] = functions.copyNode;
				actions[CONSTANTS.ACTIONS.FEEDBACK] = functions.feedback;
				actions[CONSTANTS.ACTIONS.SNIPPETS] = functions.extractLoacales;
				actions[CONSTANTS.ACTIONS.SSE_DOWNLOAD] = functions.downloadSSE;
				actions[CONSTANTS.ACTIONS.SSE_UPLOAD] = functions.uploadSSE;
				actions[CONSTANTS.ACTIONS.SSE_DELETE] = functions.deleteSSE;

				let action = await infoRequest.quickPick(CONSTANTS.ACTIONS.ALL,TEXTS.MORE_FN.CHOOSE_ACTION);
				if (!action) return;

				action = action.substring(action.lastIndexOf(")") + 2);
				if (actions[action]) actions[action]();
			} catch (e) {
				logger.postError({
					source: "dcu.more",
					error: e.message,
					stack: e.stack,
				});
			}
		});

		for (var i in buttons) {
			if (!buttons[i].hidden) {
				buttons[i].show();
			}
		}
	} catch (e) {
		vscode.window.showErrorMessage("FATAL ERROR");
		logger.postError({
			source: "registerCommands",
			error: e.message,
			stack: e.stack,
		});
	}
}
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	try {
		STORAGE = context.workspaceState;
		dcu.init(STORAGE);
		registerCommands();
	} catch (e) {
		vscode.window.showErrorMessage("Error activando:" + e);
	}
}
exports.activate = activate;
