//TODO quitar -i del -m y del -x
const vscode = require('vscode');
const dcu = require("./js/dcu");
const DcuItem = require("./js/DcuItemBar");
const utils = require("./js/utils");
const fs = require("fs");
let STORAGE;
// const CONSTANTS = JSON.parse(fs.readFileSync('./js/CONSTANTS.json', 'utf-8'));
const CONSTANTS = require("./js/CONS/CONSTANTS.json");

const grab = new DcuItem({
	command: "dcu.grab",
	icon: "extensions-install-count",
	tooltip: "Descargar ambiente",
	msg: {
		start: CONSTANTS.MSGS.GRAB_START,
		success: CONSTANTS.MSGS.GRAB_OK,
		error: CONSTANTS.MSGS.GRAB_ERROR,
		warn: ""
	}
});

const updateWidget = new DcuItem({
	command: "dcu.e",
	icon: "fold-down",
	tooltip: "Actualizar Widget",
	msg: {
		start: CONSTANTS.MSGS.REFRESH_STRAT,
		success: CONSTANTS.MSGS.REFRESH_OK,
		error: CONSTANTS.MSGS.REFRESH_ERROR,
		warn: ""
	}
});

const putFile = new DcuItem({
	command: "dcu.t",
	icon: "chevron-up",
	tooltip: "Subir archivo",
	msg: {
		start: CONSTANTS.MSGS.PUT_START,
		success: CONSTANTS.MSGS.PUT_OK,
		error: CONSTANTS.MSGS.PUT_ERROR,
		warn: ""
	}
});

const putFolder = new DcuItem({
	command: "dcu.m",
	icon: "fold-up",
	tooltip: "Subir Widget",
	msg: {
		start: CONSTANTS.MSGS.PUT_ALL_START,
		success: CONSTANTS.MSGS.PUT_ALL_OK,
		error: CONSTANTS.MSGS.PUT_ALL_ERROR,
		warn: ""
	}
});

const transferFile = new DcuItem({
	command: "dcu.r",
	icon: "run",
	tooltip: "Migrar archivo",
	msg: {
		start: CONSTANTS.MSGS.TRANSFER_START,
		success: CONSTANTS.MSGS.TRANSFER_OK,
		error: CONSTANTS.MSGS.TRANSFER_ERROR,
		warn: ""
	}
});

const transferFolder = new DcuItem({
	command: "dcu.x",
	icon: "run-all",
	tooltip: "Migrar Widget",
	msg: {
		start: CONSTANTS.MSGS.TRANSFER_START,
		success: CONSTANTS.MSGS.TRANSFER_OK,
		error: CONSTANTS.MSGS.TRANSFER_ERROR,
		warn: ""
	}
});

const migrateLayout = new DcuItem({
	command: "plsu.y",
	icon: "references",
	tooltip: "Migrar Layout",
	msg: {
		start: CONSTANTS.MSGS.PLSU_START,
		success: CONSTANTS.MSGS.PLSU_OK,
		error: CONSTANTS.MSGS.PLSU_ERROR,
		warn: ""
	}
});

// const debug = new DcuItem({
// 	command: "debug",
// 	icon: "callstack-view-session",
// 	show: true
// });


function registerCommands() {
	try {

		vscode.commands.registerCommand("dcu.e", async () => {
			let editor = vscode.window.visibleTextEditors.find((editor) => {
				return editor.document.languageId != CONSTANTS.EDITORS.LOG;
			});
			let command, env;
			if (editor) {
				env = dcu.findEnvironment();

				if (env.componentName.toUpperCase() == CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
					env.componentName.toUpperCase() == CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
					env.componentName.toUpperCase() == CONSTANTS.COMPONENTS.SNIPPET.toUpperCase()) {
					command = `dcu -e "${env.componentName}" -k ${env.key}`;
				} else {
					command = `dcu -e "${env.fileType}/${env.componentName}" -k ${env.key}`
				}

			} else {
				if (vscode.workspace.workspaceFolders.length == 0) {
					dcu.error("No hay carpetas abiertas");
					return;
				}

				let occFolders = vscode.workspace.workspaceFolders.filter((folder) => {
					let dir = fs.readdirSync(folder.uri.fsPath);
					return dir.indexOf(".ccc") != -1
				});
				let item;

				if (occFolders.length == 0) {
					dcu.error("Ninguna carpeta abierta posee codigo de OCC");
					return;
				} else if (occFolders.length == 1) {
					item = occFolders[0].name;
				} else {
					let options = occFolders.map((folder) => {
						return folder.name;
					});

					item = await vscode.window.showQuickPick(options, {
						ignoreFocusOut: true,
						placeHolder: "Seleccione un ambiente donde actualizar el widget"
					});
				}

				if (item) {
					let comp = await vscode.window.showInputBox({
						ignoreFocusOut: true,
						placeHolder: "widgetName/elementName/global/theme/snippet (En widgets y elementos se deben respetar mayusculas y minusculas)",
						prompt: "Que componente desea actualizar?"
					});

					if (comp) {
						let folder
						folder = occFolders.find((fold) => {
							return fold.name == item;
						});
						env = dcu.findEnvironment(folder);
						env.componentName = comp;

						if (comp.toUpperCase() == CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
							comp.toUpperCase() == CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
							comp.toUpperCase() == CONSTANTS.COMPONENTS.SNIPPET.toUpperCase()) {
							command = `dcu -e ${comp.toLocaleLowerCase()} -k ${env.key}`;
						} else {
							let folderInfo = fs.readdirSync(folder.uri.fsPath + "/element");
							if (folderInfo.indexOf(comp) != -1) {
								command = `dcu -e "element/${comp}" -k ${env.key}`;
							} else {
								let folderInfo = fs.readdirSync(folder.uri.fsPath + "/widget");
								if (folderInfo.indexOf(comp) != -1) {
									command = `dcu -e "widget/${comp}" -k ${env.key}`;
								} else {
									dcu.error("No se encontro el componente");
									return;
								}
							}
						}
					}
				}
			}

			updateWidget.task = command;
			dcu.runCommand(updateWidget, env, {
				componentName: env.componentName
			}, null, null);
		});

		vscode.commands.registerCommand("dcu.grab", () => {
			vscode.window.showQuickPick([CONSTANTS.ENV.DEV, CONSTANTS.ENV.TEST, CONSTANTS.ENV.STAGE, CONSTANTS.ENV.PROD], {
				ignoreFocusOut: true,
				placeHolder: "Seleccione un ambiente para descargar"
			}).then((item) => {

				if (!dcu.getConfig(CONSTANTS.CONFIG[item], CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL) ||
					!dcu.getConfig(CONSTANTS.CONFIG[item], CONSTANTS.CONFIG.PROPS.APP_KEY)) {
					dcu.error({
						msg: CONSTANTS.MSGS.GRAB_ERROR,
						detail: "No se encuentra configuración para el ambiente seleccionado",
						replace: {
							envName: item
						}
					});
					return;
				}

				if (vscode.workspace.workspaceFolders.length === 0) {
					dcu.error({
						msg: CONSTANTS.MSGS.GRAB_ERROR,
						detail: "No hay carpetas abiertas para descargar el código. Agregue o cree una e intente nuevamente",
						replace: {
							envName: item
						}
					});
					return;
				}

				vscode.window.showWorkspaceFolderPick({
					ignoreFocusOut: true,
					placeHolder: "Seleccione una carpeta donde descargar el código"
				}).then((folder) => {
					if (!folder) {
						dcu.error({
							msg: CONSTANTS.MSGS.GRAB_ERROR,
							detail: "No se seleccionó ninguna carpeta",
							replace: {
								envName: item
							}
						});
					}

					const node = dcu.getConfig(CONSTANTS.CONFIG[item], CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL)
					const key = dcu.getConfig(CONSTANTS.CONFIG[item], CONSTANTS.CONFIG.PROPS.APP_KEY);

					grab.task = `dcu -g -c -n "${node}"  -k ${key}`;

					dcu.runCommand(grab, null, {
						envName: item
					}, null, null);
				});
			});
		});

		vscode.commands.registerCommand("dcu.t", async () => {
			let editor = vscode.window.visibleTextEditors.find((editor) => {
				return editor.document.languageId != CONSTANTS.EDITORS.LOG;
			});
			if (!editor) {
				dcu.error("No hay editores abiertos");
				return;
			}

			const env = dcu.findEnvironment();
			if (env) {
				let updateAllInstances = dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.UPDATE_ALL_INSTANCES);
				editor.document.save();
				putFile.task = `dcu ${updateAllInstances && editor.document.uri.path.indexOf("instances") == -1 ? " -i " : " "} -t "${editor.document.uri.fsPath}" -k ${env.key}`;

				dcu.runCommand(putFile, env, {
					fileName: env.componentName
				}, null, null);
			}
		});

		vscode.commands.registerCommand("dcu.m", async () => {
			let editor = vscode.window.visibleTextEditors.find((editor) => {
				return editor.document.languageId != CONSTANTS.EDITORS.LOG;
			});
			let env, command;
			if (editor) {
				env = dcu.findEnvironment();
				command = `dcu -m "${env.componentPath}" -k ${env.key}`;
			}
			else {
				if (vscode.workspace.workspaceFolders.length == 0) {
					dcu.error("No hay carpetas abiertas");
					return;
				}

				let occFolders = vscode.workspace.workspaceFolders.filter((folder) => {
					let dir = fs.readdirSync(folder.uri.fsPath);
					return dir.indexOf(".ccc") != -1
				});
				let item;

				if (occFolders.length == 0) {
					dcu.error("Ninguna carpeta abierta posee codigo de OCC");
					return;
				} else if (occFolders.length == 1) {
					item = occFolders[0].name;
				} else {
					let options = occFolders.map((folder) => {
						return folder.name;
					});

					item = await vscode.window.showQuickPick(options, {
						ignoreFocusOut: true,
						placeHolder: "Seleccione un ambiente donde actualizar el widget"
					});
				}

				if (item) {
					let comp = await vscode.window.showInputBox({
						ignoreFocusOut: true,
						placeHolder: "widgetName/elementName/global/theme/snippet (En widgets y elementos se deben respetar mayusculas y minusculas)",
						prompt: "Que componente desea actualizar?"
					});

					if (comp) {
						let folder
						folder = occFolders.find((fold) => {
							return fold.name == item;
						});
						env = dcu.findEnvironment(folder);
						env.componentName = comp;

						if (comp.toUpperCase() == CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
							comp.toUpperCase() == CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
							comp.toUpperCase() == CONSTANTS.COMPONENTS.SNIPPET.toUpperCase()) {
							command = `dcu -m ${comp.toLocaleLowerCase()} -k ${env.key}`;
						} else {
							let folderInfo = fs.readdirSync(folder.uri.fsPath + "/element");
							if (folderInfo.indexOf(comp) != -1) {
								command = `dcu -m "element/${comp}" -k ${env.key}`;
							} else {
								let folderInfo = fs.readdirSync(folder.uri.fsPath + "/widget");
								if (folderInfo.indexOf(comp) != -1) {
									command = `dcu -m "widget/${comp}" -k ${env.key}`;
								} else {
									dcu.error("No se encontro el componente");
									return;
								}
							}
						}
					}
				}
			}


			if (env) {
				vscode.window.visibleTextEditors.forEach((editor) => {
					editor.document.save();
				});

				putFolder.task = command;

				dcu.runCommand(putFolder, env, {
					componentName: env.componentName
				}, null, null);
			}
		});

		vscode.commands.registerCommand("dcu.r", async () => {
			let editor = vscode.window.visibleTextEditors.find((editor) => {
				return editor.document.languageId != CONSTANTS.EDITORS.LOG;
			});

			let path;
			if (editor) {
				path = editor.document.uri.path.substr(1);
			} else {
				path = await vscode.window.showInputBox({
					ignoreFocusOut: true,
					placeHolder: "c:/user/desktop/...",
					prompt: "Coloque la url del archivo a migarar"
				});
			}

			let pathSymbol = path.indexOf("/") != -1 ? "/" : "\\";

			let dest = await vscode.window.showQuickPick(CONSTANTS.ENV.ALL, {
				placeHolder: "Seleccione el destino"
			});

			let fileName = path.split(pathSymbol)[path.split(pathSymbol).length - 1]
			const envUrl = dcu.getConfig(CONSTANTS.CONFIG[dest], CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL);
			const envKey = dcu.getConfig(CONSTANTS.CONFIG[dest], CONSTANTS.CONFIG.PROPS.APP_KEY);

			if (!envKey || !envUrl) {
				dcu.error({
					msg: CONSTANTS.MSGS.TRANSFER_ERROR,
					detail: "No se encontró url o key de destino",
					replaceOptions: {
						componentName: fileName,
						destEnv: dest
					}
				});
				return;
			}

			transferFile.task = `dcu -n "${envUrl}" -k ${envKey} -r "${path}"`;

			dcu.runCommand(transferFile, null, {
				componentName: fileName,
				destEnv: dest
			}, null, null);
		});

		vscode.commands.registerCommand("dcu.x", async () => {
			let editor = vscode.window.visibleTextEditors.find((editor) => {
				return editor.document.languageId != CONSTANTS.EDITORS.LOG;
			});
			let env, command;
			if (editor) {
				env = dcu.findEnvironment();
				let migrateConfig;
				if (dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.MIGRATE_CONFIGS) === CONSTANTS.PREGUNTAR) {
					migrateConfig = await vscode.window.showQuickPick([CONSTANTS.SI, CONSTANTS.NO], {
						placeHolder: "¿Migrar configuraciones del Widget?"
					});
				} else {
					migrateConfig = dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.MIGRATE_CONFIGS);
				}
				command = `dcu -x "${env.componentPath}" ${migrateConfig === CONSTANTS.NO ? " -o " : " "}`;
			}
			else {
				if (vscode.workspace.workspaceFolders.length == 0) {
					dcu.error("No hay carpetas abiertas");
					return;
				}

				let occFolders = vscode.workspace.workspaceFolders.filter((folder) => {
					let dir = fs.readdirSync(folder.uri.fsPath);
					return dir.indexOf(".ccc") != -1
				});
				let item;

				if (occFolders.length == 0) {
					dcu.error("Ninguna carpeta abierta posee codigo de OCC");
					return;
				} else if (occFolders.length == 1) {
					item = occFolders[0].name;
				} else {
					let options = occFolders.map((folder) => {
						return folder.name;
					});

					item = await vscode.window.showQuickPick(options, {
						ignoreFocusOut: true,
						placeHolder: "Seleccione un ambiente donde actualizar el widget"
					});
				}

				if (item) {
					let comp = await vscode.window.showInputBox({
						ignoreFocusOut: true,
						placeHolder: "widgetName/elementName/global/theme/snippet (En widgets y elementos se deben respetar mayusculas y minusculas)",
						prompt: "Que componente desea migrar?"
					});

					if (comp) {
						let folder
						folder = occFolders.find((fold) => {
							return fold.name == item;
						});
						env = dcu.findEnvironment(folder);
						env.componentName = comp;
						let migrateConfig;
						if (dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.MIGRATE_CONFIGS) === CONSTANTS.PREGUNTAR) {
							migrateConfig = await vscode.window.showQuickPick([CONSTANTS.SI, CONSTANTS.NO], {
								placeHolder: "¿Migrar configuraciones del Widget?"
							});
						} else {
							migrateConfig = dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.MIGRATE_CONFIGS);
						}

						if (comp.toUpperCase() == CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
							comp.toUpperCase() == CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
							comp.toUpperCase() == CONSTANTS.COMPONENTS.SNIPPET.toUpperCase()) {
							command = `dcu -x "${comp.toLocaleLowerCase()}" ${migrateConfig === CONSTANTS.NO ? " -o " : " "}`;
						} else {
							let folderInfo = fs.readdirSync(folder.uri.fsPath + "/element");
							if (folderInfo.indexOf(comp) != -1) {
								command = `dcu -x "element/${comp}" ${migrateConfig === CONSTANTS.NO ? " -o " : " "}`;
							} else {
								let folderInfo = fs.readdirSync(folder.uri.fsPath + "/widget");
								if (folderInfo.indexOf(comp) != -1) {
									command = `dcu -x "widget/${comp}" ${migrateConfig === CONSTANTS.NO ? " -o " : " "}`;
								} else {
									dcu.error("No se encontro el componente");
									return;
								}
							}
						}
					}
				}
			}

			let dest = await vscode.window.showQuickPick(CONSTANTS.ENV.ALL, {
				placeHolder: "Seleccione el destino"
			});

			const envUrl = dcu.getConfig(CONSTANTS.CONFIG[dest], CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL);
			const envKey = dcu.getConfig(CONSTANTS.CONFIG[dest], CONSTANTS.CONFIG.PROPS.APP_KEY);

			if (!envKey || !envUrl) {
				dcu.error({
					msg: CONSTANTS.MSGS.TRANSFER_ERROR,
					detail: "No se encontró url o key de destino",
					replaceOptions: {
						componentName: env.componentName,
						destEnv: dest
					}
				});
				return;
			}

			command += ` -n ${envUrl} -k ${envKey}`;

			transferFolder.task = command;



			if (env) {
				vscode.window.visibleTextEditors.forEach((editor) => {
					editor.document.save();
				});

				transferFolder.task = command;

				dcu.runCommand(transferFolder, env, {
					componentName: env.componentName,
					destEnv: dest
				}, (taskInfo) => {
					if (taskInfo[CONSTANTS.MGS_TYPES.WARN]) {
						dcu.warn({
							msg: "La migración arrojo algunas advertencias",
							items: ["VER"],
							callback: () => {
								dcu.showOutput();
							}
						});
					}
				}, null)
			}
		});

		async function migrateLayouts(component) {
			let origin = await vscode.window.showQuickPick(CONSTANTS.ENV.ALL, {
				ignoreFocusOut: true,
				placeHolder: "Seleccione el ORIGEN"
			});

			let dest = await vscode.window.showQuickPick(CONSTANTS.ENV.ALL, {
				ignoreFocusOut: true,
				placeHolder: "Seleccione el DESTINO"
			});

			if (origin == dest) {
				dcu.error("El origen no puede ser igual al destino");
				return
			}

			let urlOrigin = dcu.getConfig(CONSTANTS.CONFIG[origin], CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL);
			let keyOrigin = dcu.getConfig(CONSTANTS.CONFIG[origin], CONSTANTS.CONFIG.PROPS.APP_KEY);
			let urlDest = dcu.getConfig(CONSTANTS.CONFIG[dest], CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL);
			let keyDest = dcu.getConfig(CONSTANTS.CONFIG[dest], CONSTANTS.CONFIG.PROPS.APP_KEY);

			if (!urlOrigin || !keyOrigin || !urlDest || !keyDest) {
				dcu.error("Falta la URL o la APP_KEY del ambiente de ORIGEN o DESTINO");
				return;
			}

			dcu.warn({
				msg: `Recuerda migrar todos los widgets y las instancias asociadas a ${component ? "este layout" : "los layouts"}, antes de ejecutar la migración`,
				items: ["CONTINUAR", "CANCELAR"],
				callback: (res) => {
					if (res === "CONTINUAR") {
						let command = `plsu -n "${urlOrigin}" -k "${keyOrigin}" -d "${urlDest}" -a "${keyDest}" -t`;
						if (component && component != "*") {
							command += ` -y "${component}" `;
						} else if (component && component == "*") {
							command += ` -s `
						}
						if (dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.IGNORE_COMMERCE_VERSION)) {
							command += " -g";
						}

						migrateLayout.task = command;
						dcu.runCommand(migrateLayout, null, {
							layoutName: component != "*" ? component : "todos los Layouts",
							destEnv: dest
						}, null, null);
					}
				}
			});
		}

		vscode.commands.registerCommand("plsu.y", async () => {
			let component = await vscode.window.showInputBox({
				ignoreFocusOut: true,
				placeHolder: "OCS_ProductDetails",
				prompt: "Que layout desea migrar? (Ingrese * para migrar todos)"
			});

			if (component) {
				migrateLayouts(component);
			} else {
				dcu.error({
					msg: "No se ingreso layout"
				});
			}

		});
	} catch (e) {
		vscode.window.showErrorMessage("Error registrando comandos" + e);
	}
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	try {
		// let itemBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
		// itemBar.text="DEBUG";
		STORAGE = context.workspaceState;
		registerCommands();
		utils.validateVersion(STORAGE);
	} catch (e) {
		vscode.window.showErrorMessage("Error activando:" + e);
	}
}
exports.activate = activate;