const vscode = require('vscode');
const cmd = require('node-cmd');
const dcu = require("./js/dcu");
const DcuItem = require("./js/DcuItemBar");
const fs = require("fs");
let STORAGE;
const CONSTANTS = dcu.CONST;


const grab = new DcuItem({
	command: "dcu.grab",
	icon: "extensions-install-count",
	tooltip: "Descargar ambiente",
	show: true
});

const updateWidget = new DcuItem({
	command: "dcu.e",
	icon: "notebook-revert",
	tooltip: "Actualizar Widget",
	show: true
});

const putFile = new DcuItem({
	command: "dcu.t",
	icon: "chevron-up",
	tooltip: "Subir archivo",
	show: true
});

const putFolder = new DcuItem({
	command: "dcu.m",
	icon: "fold-up",
	tooltip: "Subir Widget",
	show: true
});

const transferFile = new DcuItem({
	command: "dcu.r",
	icon: "run",
	tooltip: "Migrar archivo",
	show: true
});

const transferFolder = new DcuItem({
	command: "dcu.x",
	icon: "run-all",
	tooltip: "Migrar Widget",
	show: true
});

const migrateLayout = new DcuItem({
	command: "plsu.y",
	icon: "folder",
	tooltip: "Migrar Layout",
	show: true
});

const migrateAllLayouts = new DcuItem({
	command: "plsu.s",
	icon: "folder-active",
	tooltip: "Migrar todos los Layouts",
	show: true
});


// const debug = new DcuItem({
// 	command: "debug",
// 	icon: "callstack-view-session",
// 	show: true
// });

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

function showItems() {
	if (!dcu.getConfig(CONSTANTS.CONFIG.GENERAL_FUNCTIONS, CONSTANTS.CONFIG.PROPS.FUNCTION_GRAB)) {
		grab.hide();
	}
	if (!dcu.getConfig(CONSTANTS.CONFIG.GENERAL_FUNCTIONS, CONSTANTS.CONFIG.PROPS.FUNCTION_REFRESH)) {
		updateWidget.hide();
	}
	if (!dcu.getConfig(CONSTANTS.CONFIG.GENERAL_FUNCTIONS, CONSTANTS.CONFIG.PROPS.FUNCTION_PUT_FILE)) {
		putFile.hide();
	}
	if (!dcu.getConfig(CONSTANTS.CONFIG.GENERAL_FUNCTIONS, CONSTANTS.CONFIG.PROPS.FUNCTION_PUT_ALL)) {
		putFolder.hide();
	}
	if (!dcu.getConfig(CONSTANTS.CONFIG.GENERAL_FUNCTIONS, CONSTANTS.CONFIG.PROPS.FUNCTION_TRANSFER_FILE)) {
		transferFile.hide();
	}
	if (!dcu.getConfig(CONSTANTS.CONFIG.GENERAL_FUNCTIONS, CONSTANTS.CONFIG.PROPS.FUNCTION_TRANSFER_ALL)) {
		transferFolder.hide();
	}
	if (!dcu.getConfig(CONSTANTS.CONFIG.GENERAL_FUNCTIONS, CONSTANTS.CONFIG.PROPS.FUNCTION_CLONE_LAYOUT)) {
		migrateLayout.hide();
	}
	if (!dcu.getConfig(CONSTANTS.CONFIG.GENERAL_FUNCTIONS, CONSTANTS.CONFIG.PROPS.FUNCTION_CLONE_ALL_LAYOUTS)) {
		migrateAllLayouts.hide();
	}
	//TODO A RE FUTURO -> Ocultar botones segun archivo/carpeta abierto
};

function registerCommands() {
	// vscode.commands.registerCommand("debug", async () => {
		
	// });

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
			let updateAllInstances = dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.UPDATE_ALL_INSTANCES);
			let command = `dcu ${updateAllInstances && editor.document.uri.path.indexOf("instances") == -1 ? " -i " : " "} -t "${editor.document.uri.fsPath}" -k ${env.key}`;

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

		// if(dest === CONSTANTS.ENV.PROD){
		// 	let res = await dcu.warn({
		// 		msg: "Estas por enviar un archivo a PRODUCCIÓN, ¿Deseas continuar?",
		// 		items: [CONSTANTS.SI, CONSTANTS.NO],

		// 	})
		// }

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
						msg: component ? CONSTANTS.MSGS.PLSU_START : "Clonando todos los layouts en @@destEnv@@...",
						replaceOptions: {
							layoutName: component,
							destEnv: dest
						}
					});
					if (component) {
						migrateLayout.toggleSpinIcon();
					} else {
						migrateAllLayouts.toggleSpinIcon();
					}

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
							if (component) {
								migrateLayout.fail();
							} else {
								migrateAllLayouts.fail();
							}
							dcu.error({
								msg: command ? CONSTANTS.MSGS.PLSU_ERROR : "Error actualizando todos los layouts en @@destEnv@@",
								replaceOptions: {
									layoutName: component,
									destEnv: dest
								},
								detail: stderr ? stderr : error
							});
							return;
						}

						if (component) {
							migrateLayout.success();
						} else {
							migrateAllLayouts.success();
						}
						dcu.success({
							msg: command ? CONSTANTS.MSGS.PLSU_OK : "Layouts actualizados correctamente en @@destEnv@@",
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
async function activate(context) {
	STORAGE = context.workspaceState;
	// STORAGE.update(CONSTANTS.STORAGE.SHOW_UPDATES,null);
	// vscode.window.showInformationMessage("Iniciando DCU...");
	// let itemBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
	// itemBar.text="DEBUG";
	registerCommands();
	showItems();

	vscode.workspace.onDidChangeConfiguration((e) => {
		showItems();
	});
	let currentVersion = vscode.extensions.getExtension('CrisJF.dcu-utils').packageJSON.version;
	if (!STORAGE.get(CONSTANTS.STORAGE.VERSION) || compare(STORAGE.get(CONSTANTS.STORAGE.VERSION), currentVersion) == -1) {
		STORAGE.update(CONSTANTS.STORAGE.VERSION, currentVersion);

		if (dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.NOTIFY_UPDATES) === CONSTANTS.PREGUNTAR) {
			dcu.info({
				msg: "¿Quieres ver las mejoras de la versión " + currentVersion + "?",
				items: [CONSTANTS.SI, CONSTANTS.NO],
				callback: (response) => {
					if (response === CONSTANTS.SI) {
						vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items/CrisJF.dcu-utils/changelog'));
					}
				}
			});
		} else if (dcu.getConfig(CONSTANTS.CONFIG.GENERAL, CONSTANTS.CONFIG.PROPS.NOTIFY_UPDATES) === CONSTANTS.SIEMPRE) {
			vscode.window.showInformationMessage(`Hey! Observa las novedades de DCU UTILS`);
			vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items/CrisJF.dcu-utils/changelog'));
		}
	}
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
	vscode.window.showInformationMessage("DCU Desactivado");
}
exports.deactivate = deactivate;
