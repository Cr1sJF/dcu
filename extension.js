// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const cmd = require('node-cmd');
const dcu = require("./js/dcu");
const DcuItem = require("./js/DcuItemBar");
const fs = require("fs");
const { stderr } = require('process');
const { isGetAccessor } = require('typescript');
// const { createIntersectionTypeNode } = require('typescript');

// const { cwd } = require('process');
const CONSTANTS = dcu.CONST;

const grab = new DcuItem({
	command: "dcu.grab",
	icon: "extensions-install-count",
	tooltip: "grab",
	show: true
});

const updateWidget = new DcuItem({
	command: "dcu.e",
	icon: "notebook-revert",
	tooltip: "dcu -e",
	show: true
});

const putFile = new DcuItem({
	command: "dcu.t",
	icon: "chevron-up",
	tooltip: "dcu [-i] -t",
	show: true
});

const putFolder = new DcuItem({
	command: "dcu.m",
	icon: "fold-up",
	tooltip: "dcu -m",
	show: true
});

const transferFile = new DcuItem({
	command: "dcu.r",
	icon: "run",
	tooltip: "dcu -r",
	show: true
});

const transferFolder = new DcuItem({
	command: "dcu.x",
	icon: "run-all",
	tooltip: "dcu -x",
	show: true
});

const migrateLayout = new DcuItem({
	command: "plsu.y",
	icon: "folder",
	tooltip: "plsu -y",
	show: true
});

const migrateAllLayouts = new DcuItem({
	command: "plsu.s",
	icon: "folder-active",
	tooltip: "plsu -s",
	show: true
});


const debug = new DcuItem({
	command: "debug",
	icon: "callstack-view-session",
	show: true
});

function createItems() {
	//TODO ocultar botones inactivos

	//TODO A RE FUTURO -> Ocultar botones segun archivo/carpeta abierto
};

function registerCommands() {
	vscode.commands.registerCommand("debug", async () => {
		debug.toggleSpinIcon();
		// debug.itemBar.color ="pass";
	});

	//LISTO
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

		dcu.info({
			msg: CONSTANTS.MSGS.REFRESH_STRAT,
			replaceOptions: {
				componentName: env.componentName
			}
		});

		updateWidget.toggleSpinIcon();
		cmd.run(`cd "${env.basePath}" & ${command}`, function (error, data, stderr) {
			if (error) {
				updateWidget.fail();
				dcu.error({
					msg: CONSTANTS.MSGS.REFRESH_ERROR,
					detail: error,
					replaceOptions: {
						componentName: env.componentName
					}
				});
				return;
			}

			updateWidget.success();
			dcu.success({
				msg: CONSTANTS.MSGS.REFRESH_OK,
				detail: data,
				replaceOptions: {
					componentName: env.componentName
				}
			});

			if (stderr) {
				dcu.warn({
					msg: "La actualización arrojo algunas adertencias",
					detail: stderr,
					items: ["VER"],
					callback: function () {
						dcu.showOutput();
					}
				});
			}
		});
	});

	//LISTO
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

				dcu.info({
					msg: CONSTANTS.MSGS.GRAB_START,
					detail: "No se seleccionó ninguna carpeta",
					replace: {
						envName: item
					}
				});
				grab.toggleSpinIcon();

				const node = dcu.getConfig(CONSTANTS.CONFIG[item], CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL)
				const key = dcu.getConfig(CONSTANTS.CONFIG[item], CONSTANTS.CONFIG.PROPS.APP_KEY);

				const command = `dcu -g -c -n "${node}"  -k ${key}`;

				cmd.run(`cd "${folder.uri.fsPath}" & ${command}`, function (error, data, stderr) {
					if (error) {
						grab.fail();
						dcu.error({
							msg: CONSTANTS.MSGS.GRAB_ERROR,
							detail: error,
							replace: {
								envName: item
							}
						});
						return;
					}

					grab.success();
					dcu.success({
						msg: CONSTANTS.MSGS.GRAB_OK,
						detail: data
					});

					if (stderr) {
						dcu.warn({
							msg: "El GRAB arrojo algunas advertencias",
							detail: stderr,
							items: ["VER"],
							callback: function () {
								dcu.showOutput();
							}
						});
					}

				});
			});
		});
	});

	//LISTO
	vscode.commands.registerCommand("dcu.t", async () => {
		let editor = vscode.window.visibleTextEditors.find((editor) => {
			return editor.document.languageId != CONSTANTS.EDITORS.LOG;
		});
		if (!editor) {
			dcu.error("No hay editores abiertos");
			return;
		}

		const env = dcu.findEnvironment();

		putFile.toggleSpinIcon();
		dcu.info({
			msg: CONSTANTS.MSGS.PUT_START,
			replace: {
				fileName: env.componentName
			}
		});



		if (env) {
			let command = "dcu -t \"" + editor.document.uri.fsPath + "\" -k " + env.key;
			let updateAllInstances = dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.UPDATE_ALL_INSTANCES);
			if (updateAllInstances) {
				command += " -i"
			}

			editor.document.save();
			cmd.run(command, function (error, data, stderr) {
				if (error || stderr) {
					dcu.error({
						msg: CONSTANTS.MSGS.PUT_ERROR,
						detail: error && stderr ? error + "\n" + error : error || stderr,
						replace: {
							fileName: env.componentName
						}
					});
					putFile.fail();
					return;
				}
				putFile.success();
				dcu.info({
					msg: CONSTANTS.MSGS.PUT_OK,
					detail: data,
					replace: {
						fileName: env.componentName
					}
				});
			});

		}
	});

	//LISTO
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
			putFolder.toggleSpinIcon();
			dcu.info({
				msg: CONSTANTS.MSGS.PUT_ALL_START,
				replace: {
					componentName: env.componentName
				}
			});
			// let updateAllInstances = dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.UPDATE_ALL_INSTANCES);
			// if (updateAllInstances) {
			// 	command += " -i"
			// }

			vscode.window.visibleTextEditors.forEach((editor) => {
				editor.document.save();
			});

			cmd.run(`cd "${env.basePath}" & ${command}`, function (error, data, stderr) {
				if (error || stderr) {
					dcu.error({
						msg: CONSTANTS.MSGS.PUT_ALL_ERROR,
						detail: error && stderr ? error + "\n" + error : error || stderr,
						replace: {
							componentName: env.componentName
						}
					});
					putFolder.fail();
					return;
				}
				putFolder.success();
				dcu.info({
					msg: CONSTANTS.MSGS.PUT_ALL_OK,
					detail: data,
					replace: {
						componentName: env.componentName
					}
				});
			});
		}
	});

	//LISTO
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

		transferFile.toggleSpinIcon();
		dcu.info({
			msg: CONSTANTS.MSGS.TRANSFER_START,
			replaceOptions: {
				componentName: fileName,
				destEnv: dest
			}
		});

		cmd.run(`cd "${path.substr(0, path.lastIndexOf(pathSymbol))}" & dcu -n "${envUrl}" -k ${envKey} -r "${path}"`, function (error, data, stderr) {
			if (error) {
				dcu.error({
					msg: CONSTANTS.MSGS.TRANSFER_ERROR,
					detail: error && stderr ? error + "\n" + error : error || stderr,
					replace: {
						componentName: fileName,
						destEnv: dest
					}
				});
				transferFile.fail();
				return;
			}
			transferFile.success();
			dcu.info({
				msg: CONSTANTS.MSGS.TRANSFER_OK,
				detail: data,
				replace: {
					componentName: fileName,
					destEnv: dest
				}
			});
		});

	});

	//LISTO
	vscode.commands.registerCommand("dcu.x", async () => {
		let editor = vscode.window.visibleTextEditors.find((editor) => {
			return editor.document.languageId != CONSTANTS.EDITORS.LOG;
		});
		let env, command;
		if (editor) {
			env = dcu.findEnvironment();
			command = `dcu -x "${env.componentPath}" `;
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

					if (comp.toUpperCase() == CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
						comp.toUpperCase() == CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
						comp.toUpperCase() == CONSTANTS.COMPONENTS.SNIPPET.toUpperCase()) {
						command = `dcu -x ${comp.toLocaleLowerCase()} `;
					} else {
						let folderInfo = fs.readdirSync(folder.uri.fsPath + "/element");
						if (folderInfo.indexOf(comp) != -1) {
							command = `dcu -x "element/${comp}" `;
						} else {
							let folderInfo = fs.readdirSync(folder.uri.fsPath + "/widget");
							if (folderInfo.indexOf(comp) != -1) {
								command = `dcu -x "widget/${comp}" `;
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

		command += ` -n ${envUrl} -k ${envKey}`

		if (env) {
			transferFolder.toggleSpinIcon();
			dcu.info({
				msg: CONSTANTS.MSGS.TRANSFER_START,
				replace: {
					componentName: env.componentName,
					destEnv: dest
				}
			});
			// let updateAllInstances = dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.UPDATE_ALL_INSTANCES);
			// if (updateAllInstances) {
			// 	command += " -i"
			// }

			vscode.window.visibleTextEditors.forEach((editor) => {
				editor.document.save();
			});

			cmd.run(`cd "${env.basePath}" & ${command}`, function (error, data, stderr) {
				if (error || stderr) {
					dcu.error({
						msg: CONSTANTS.MSGS.PUT_ALL_ERROR,
						detail: error && stderr ? error + "\n" + error : error || stderr,
						replace: {
							componentName: env.componentName
						}
					});
					transferFolder.fail();
					return;
				}
				transferFolder.success();
				dcu.info({
					msg: CONSTANTS.MSGS.TRANSFER_OK,
					detail: data,
					replace: {
						componentName: env.componentName,
						destEnv: dest
					}
				});

				if (stderr) {
					dcu.warn({
						msg: "La migración arrojo algunas advertencias",
						items: ["VER"],
						callback: () => {
							dcu.showOutput();
						}
					})
				}
			});
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
					dcu.info({
						msg: CONSTANTS.MSGS.PLSU_START,
						replaceOptions: {
							layoutName: component,
							destEnv: dest
						}
					});
					migrateLayout.toggleSpinIcon();

					let command = `plsu -n "${urlOrigin}" -k "${keyOrigin}" -d "${urlDest}" -a "${keyDest}" -t`;
					if (component) {
						command += ` -y "${component}" `;
					} else {
						command += ` -s `
					}
					if (dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.IGNORE_COMMERCE_VERSION)) {
						command += " -g";
					}

					cmd.run(command, (error, data, stderr) => {
						if (error) {
							migrateLayout.fail();
							dcu.error({
								msg: CONSTANTS.MSGS.PLSU_ERROR,
								replaceOptions: {
									layoutName: component,
									destEnv: dest
								},
								detail: stderr ? stderr : error
							});
							return;
						}

						migrateLayout.success();
						dcu.success({
							msg: CONSTANTS.MSGS.PLSU_OK,
							replaceOptions: {
								layoutName: component,
								destEnv: dest
							}
						});
					});
				}
			}
		});
	}

	vscode.commands.registerCommand("plsu.y", async () => {
		let component = await vscode.window.showInputBox({
			ignoreFocusOut: true,
			placeHolder: "OCS_ProductDetails",
			prompt: "Que layout desea migrar?"
		});

		if (component) {
			migrateLayouts(component);
		}

	});

	vscode.commands.registerCommand("plsu.s", async () => {
		migrateLayouts();
	});

}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	registerCommands();
	createItems();
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
