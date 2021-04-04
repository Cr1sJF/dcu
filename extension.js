const vscode = require("vscode");
const dcu = require("./js/dcu");
const DcuItem = require("./js/DcuItemBar");
const fs = require("fs");
let STORAGE;
// const CONSTANTS = JSON.parse(fs.readFileSync('./js/CONSTANTS.json', 'utf-8'));
const CONSTANTS = require("./js/CONS/CONSTANTS.json");

const grab = new DcuItem({
  command: "dcu.grab",
  icon: "extensions-install-count",
  tooltip: "Descargar ambiente",
  type: CONSTANTS.ITEM_TYPES.DOWNLOAD,
  msg: {
    start: CONSTANTS.MSGS.GRAB_START,
    success: CONSTANTS.MSGS.GRAB_OK,
    error: CONSTANTS.MSGS.GRAB_ERROR,
    trackingMsg: "Descargaste el ambiente @@envName@@",
    warn: "",
  },
});

const updateWidget = new DcuItem({
  command: "dcu.e",
  icon: "extensions-sync-enabled",
  tooltip: "Actualizar Widget",
  type: CONSTANTS.ITEM_TYPES.DOWNLOAD,
  msg: {
    start: CONSTANTS.MSGS.REFRESH_STRAT,
    success: CONSTANTS.MSGS.REFRESH_OK,
    error: CONSTANTS.MSGS.REFRESH_ERROR,
    trackingMsg: "Descargaste de @@envName@@: \n@@componentName@@",
    warn: "",
  },
});

const putFile = new DcuItem({
  command: "dcu.t",
  icon: "chevron-up",
  tooltip: "Subir archivo",
  type: CONSTANTS.ITEM_TYPES.UPLOAD,
  msg: {
    start: CONSTANTS.MSGS.PUT_START,
    success: CONSTANTS.MSGS.PUT_OK,
    error: CONSTANTS.MSGS.PUT_ERROR,
    trackingMsg: "Subiste a @@envName@@: \n@@fileName@@",
    warn: "",
  },
});

const putFolder = new DcuItem({
  command: "dcu.m",
  icon: "fold-up",
  tooltip: "Subir Widget",
  type: CONSTANTS.ITEM_TYPES.UPLOAD,
  msg: {
    start: CONSTANTS.MSGS.PUT_ALL_START,
    success: CONSTANTS.MSGS.PUT_ALL_OK,
    error: CONSTANTS.MSGS.PUT_ALL_ERROR,
    trackingMsg: "Subiste a @@envName@@: \n@@componentName@@",
    warn: "",
  },
});

const transferFile = new DcuItem({
  command: "dcu.r",
  icon: "run",
  tooltip: "Migrar archivo",
  type: CONSTANTS.ITEM_TYPES.MIGRATION,
  msg: {
    start: CONSTANTS.MSGS.TRANSFER_START,
    success: CONSTANTS.MSGS.TRANSFER_OK,
    error: CONSTANTS.MSGS.TRANSFER_ERROR,
    trackingMsg: "Migraste a @@destEnv@@: \n@@componentName@@",
    warn: "",
  },
});

const transferFolder = new DcuItem({
  command: "dcu.x",
  icon: "run-all",
  tooltip: "Migrar Widget",
  type: CONSTANTS.ITEM_TYPES.MIGRATION,
  msg: {
    start: CONSTANTS.MSGS.TRANSFER_START,
    success: CONSTANTS.MSGS.TRANSFER_OK,
    error: CONSTANTS.MSGS.TRANSFER_ERROR,
    trackingMsg: "Migraste a @@destEnv@@: \n@@componentName@@",
    warn: "",
  },
});

const migrateLayout = new DcuItem({
  command: "plsu.y",
  icon: "references",
  tooltip: "Migrar Layout",
  type: CONSTANTS.ITEM_TYPES.MIGRATION,
  msg: {
    start: CONSTANTS.MSGS.PLSU_START,
    success: CONSTANTS.MSGS.PLSU_OK,
    error: CONSTANTS.MSGS.PLSU_ERROR,
    trackingMsg: "Migraste a @@destEnv@@: \n@@layoutName@@",
    warn: "",
  },
});

// const debug = new DcuItem({
// 	command: "debug",
// 	icon: "callstack-view-session",
// 	show: true
// });

function registerCommands() {
  try {
    vscode.commands.registerCommand("dcu.e", async (externalFile) => {
      let editor;
      if (!externalFile) {
        editor = vscode.window.visibleTextEditors.find((editor) => {
          return editor.document.languageId != CONSTANTS.EDITORS.LOG;
        });
      }

      let command, env;
      if (editor || externalFile) {
        if (externalFile) {
          env = dcu.findEnvironment(externalFile);
        } else {
          env = dcu.findEnvironment();
        }

        if (
          env.componentName.toUpperCase() ==
          CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
          env.componentName.toUpperCase() ==
          CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
          env.componentName.toUpperCase() ==
          CONSTANTS.COMPONENTS.SNIPPET.toUpperCase() ||
          env.componentName.toUpperCase() ==
          CONSTANTS.COMPONENTS.SITE_SETTINGS.toUpperCase()
        ) {
          command = `dcu -e "${env.componentName}" -k ${env.key}`;
        } else {
          command = `dcu -e "${env.fileType}/${env.componentName}" -k ${env.key}`;
        }
      } else {
        if (vscode.workspace.workspaceFolders.length == 0) {
          dcu.error("No hay carpetas abiertas");
          return;
        }

        let occFolders = vscode.workspace.workspaceFolders.filter((folder) => {
          let dir = fs.readdirSync(folder.uri.fsPath);
          return dir.indexOf(".ccc") != -1;
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
            placeHolder: "Seleccione un ambiente donde actualizar el widget",
          });
        }

        if (item) {
          let comp = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder:
              "widgetName/elementName/global/theme/snippet (En widgets y elementos se deben respetar mayusculas y minusculas)",
            prompt: "Que componente desea actualizar?",
          });

          if (comp) {
            let folder;
            folder = occFolders.find((fold) => {
              return fold.name == item;
            });
            env = dcu.findEnvironment(folder.uri.path);
            env.componentName = comp;

            if (
              comp.toUpperCase() == CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
              comp.toUpperCase() == CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
              comp.toUpperCase() == CONSTANTS.COMPONENTS.SNIPPET.toUpperCase()
            ) {
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
      dcu.runCommand(
        updateWidget,
        env,
        {
          componentName: env.componentName,
        },
        null,
        null
      );
    });

    vscode.commands.registerCommand("dcu.grab", (externalFile) => {
      vscode.window
        .showQuickPick(
          [
            CONSTANTS.ENV.DEV,
            CONSTANTS.ENV.TEST,
            CONSTANTS.ENV.STAGE,
            CONSTANTS.ENV.PROD,
          ],
          {
            ignoreFocusOut: true,
            placeHolder: "Seleccione un ambiente para descargar",
          }
        )
        .then((item) => {
          if (!item) {
            dcu.error("No se seleccionó ningún ambiente");
            return;
          }

          if (
            !dcu.getConfig(
              CONSTANTS.CONFIG[item],
              CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL
            ) ||
            !dcu.getConfig(
              CONSTANTS.CONFIG[item],
              CONSTANTS.CONFIG.PROPS.APP_KEY
            )
          ) {
            dcu.error({
              msg: CONSTANTS.MSGS.GRAB_ERROR,
              detail:
                "No se encuentra configuración para el ambiente seleccionado",
              replace: {
                envName: item,
              },
            });
            return;
          }

          if (externalFile) {
            const node = dcu.getConfig(
              CONSTANTS.CONFIG[item],
              CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL
            );
            const key = dcu.getConfig(
              CONSTANTS.CONFIG[item],
              CONSTANTS.CONFIG.PROPS.APP_KEY
            );

            grab.task = `dcu -g -c -n "${node}"  -k ${key}`;

            dcu.runCommand(
              grab,
              {
                basePath: dcu.buildPath(externalFile).basePath,
                env: item
              },
              {
                envName: item,
              },
              null,
              null
            );
          } else if (vscode.workspace.workspaceFolders.length === 0) {
            dcu.error({
              msg: CONSTANTS.MSGS.GRAB_ERROR,
              detail:
                "No hay carpetas abiertas para descargar el código. Agregue o cree una e intente nuevamente",
              replace: {
                envName: item,
              },
            });
            return;
          } else {
            vscode.window
              .showWorkspaceFolderPick({
                ignoreFocusOut: true,
                placeHolder: "Seleccione una carpeta donde descargar el código",
              })
              .then((folder) => {
                if (!folder) {
                  dcu.error({
                    msg: CONSTANTS.MSGS.GRAB_ERROR,
                    detail: "No se seleccionó ninguna carpeta",
                    replace: {
                      envName: item,
                    },
                  });
                }

                const node = dcu.getConfig(
                  CONSTANTS.CONFIG[item],
                  CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL
                );
                const key = dcu.getConfig(
                  CONSTANTS.CONFIG[item],
                  CONSTANTS.CONFIG.PROPS.APP_KEY
                );

                grab.task = `dcu -g -c -n "${node}"  -k ${key}`;

                dcu.runCommand(
                  grab,
                  {
                    basePath: folder.uri.fsPath,
                  },
                  {
                    envName: item,
                  },
                  null,
                  null
                );
              });
          }
        });
    });

    vscode.commands.registerCommand("dcu.t", async () => {
      let editor = vscode.window.visibleTextEditors.find((editor) => {
        return editor.document.languageId != CONSTANTS.EDITORS.LOG;
      });
      if (!editor) {
        dcu.error("No hay archivos abiertos");
        return;
      }
      let filePath = editor.document.uri.path.split("/").splice(1);
      let fileData = filePath[filePath.length - 1].split(".");
      let file;
      if (fileData.length > 2) {
        file = {
          fileName: fileData[0] + "." + fileData[1],
          fileExtension: fileData[2],
          fileFullname: fileData.join(".")
        };
      } else {
        file = {
          fileName: fileData[0],
          fileExtension: fileData[1],
          fileFullname: fileData.join(".")
        };
      }

      let instanciable = CONSTANTS.INSTANCABLES_FILES.some((f)=>{
        return file.fileFullname.indexOf(f) != -1;
      });


      const env = dcu.findEnvironment();
      if (env) {
        let updateAllInstances = dcu.getConfig(
          CONSTANTS.CONFIG.GENERAL,
          CONSTANTS.CONFIG.PROPS.UPDATE_ALL_INSTANCES
        );
        editor.document.save();
        let isBaseFile =
          editor.document.uri.path.indexOf("instances") != -1 ? false : true;
        let task = "dcu ";
        if (updateAllInstances == CONSTANTS.SIEMPRE || updateAllInstances == true) {
          task += `${instanciable ? "- i " : ""} -t "${editor.document.uri.fsPath}" -k ${env.key}`;
        }

        else if (updateAllInstances == CONSTANTS.NUNCA) {
          task += `-t "${editor.document.uri.fsPath}" -k ${env.key}`;
        }

        else if (updateAllInstances == CONSTANTS.PREGUNTAR) {
          let resp;
          if (instanciable && isBaseFile) {
            resp = await dcu.warn({
              msg: `Estas por subir un archivo base. ¿Quieres actualizar todas las instancias?`,
              items: [CONSTANTS.SI, CONSTANTS.NO],
            });
          } else {
            resp = CONSTANTS.NO;
          }

          task += `${resp == CONSTANTS.SI ? " -i -t " : " -t "} "${editor.document.uri.fsPath }" -k ${env.key}`;
        }

        else if (updateAllInstances == CONSTANTS.SOLO_SI_BASE) {
          task += `${isBaseFile && instanciable ? " -i -t " : " -t "} "${editor.document.uri.fsPath}" -k ${env.key}`;
        }

        else {
          task += `-t "${editor.document.uri.fsPath}" -k ${env.key}`;
        }

        putFile.task = task;
        let component = editor.document.uri.fsPath.split("\\");
        let componentName;
        CONSTANTS.VALID_PATHS.forEach((path) => {
          if (component.indexOf(path) != -1) {
            componentName = component.slice(component.indexOf(path)).join("/");
          }
        });
        dcu.runCommand(
          putFile,
          env,
          {
            fileName: componentName,
            componentName: env.componentName,
          },
          null,
          null
        );
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
      } else {
        if (vscode.workspace.workspaceFolders.length == 0) {
          dcu.error("No hay carpetas abiertas");
          return;
        }

        let occFolders = vscode.workspace.workspaceFolders.filter((folder) => {
          let dir = fs.readdirSync(folder.uri.fsPath);
          return dir.indexOf(".ccc") != -1;
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
            placeHolder: "Seleccione un ambiente donde actualizar el widget",
          });
        }

        if (item) {
          let comp = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder:
              "widgetName/elementName/global/theme/snippet (En widgets y elementos se deben respetar mayusculas y minusculas)",
            prompt: "Que componente desea actualizar?",
          });

          if (comp) {
            let folder;
            folder = occFolders.find((fold) => {
              return fold.name == item;
            });
            env = dcu.findEnvironment(folder.uri.path);
            env.componentName = comp;

            if (
              comp.toUpperCase() == CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
              comp.toUpperCase() == CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
              comp.toUpperCase() == CONSTANTS.COMPONENTS.SNIPPET.toUpperCase()
            ) {
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

        dcu.runCommand(
          putFolder,
          env,
          {
            componentName: env.componentName,
          },
          null,
          null
        );
      }
    });

    vscode.commands.registerCommand("dcu.r", async (externalFile) => {
      let editor = vscode.window.visibleTextEditors.find((editor) => {
        return editor.document.languageId != CONSTANTS.EDITORS.LOG;
      });

      let pathInfo, env;
      if (editor) {
        pathInfo = dcu.buildPath(editor.document.uri.path.substr(1));
      } else if (externalFile) {
        pathInfo = dcu.buildPath(externalFile.path);
        env = dcu.findEnvironment(externalFile)
      } else {
        let path = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: "c:/user/desktop/...",
          prompt: "Coloque la url del archivo a migarar",
        });
        if (!path) {
          dcu.error("No se cargo URL");
          return;
        }
        pathInfo = dcu.buildPath(path);
        env = dcu.findEnvironment(path);
      }

      // let pathSymbol = path.indexOf("/") != -1 ? "/" : "\\";

      let dest = await vscode.window.showQuickPick(CONSTANTS.ENV.ALL, {
        placeHolder: "Seleccione el destino",
      });

      // let fileName = path.split(pathSymbol)[path.split(pathSymbol).length - 1];
      let fileName = pathInfo.componentName;
      const envUrl = dcu.getConfig(
        CONSTANTS.CONFIG[dest],
        CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL
      );
      const envKey = dcu.getConfig(
        CONSTANTS.CONFIG[dest],
        CONSTANTS.CONFIG.PROPS.APP_KEY
      );

      if (!envKey || !envUrl) {
        dcu.error({
          msg: CONSTANTS.MSGS.TRANSFER_ERROR,
          detail: "No se encontró url o key de destino",
          replaceOptions: {
            componentName: fileName,
            destEnv: dest,
          },
        });
        return;
      }

      transferFile.task = `dcu -n "${envUrl}" -k ${envKey} -r "${pathInfo.fullPath}"`;

      dcu.runCommand(
        transferFile,
        env,
        {
          componentName: fileName,
          destEnv: dest,
        },
        null,
        null
      );
    });

    vscode.commands.registerCommand("dcu.x", async (externalFile) => {
      let editor = vscode.window.visibleTextEditors.find((editor) => {
        return editor.document.languageId != CONSTANTS.EDITORS.LOG;
      });
      let env, command;
      if (editor || externalFile) {
        env = dcu.findEnvironment(externalFile);
        let migrateConfig;
        if (
          dcu.getConfig(
            CONSTANTS.CONFIG.GENERAL,
            CONSTANTS.CONFIG.PROPS.MIGRATE_CONFIGS
          ) === CONSTANTS.PREGUNTAR
        ) {
          migrateConfig = await vscode.window.showQuickPick(
            [CONSTANTS.SI, CONSTANTS.NO],
            {
              placeHolder: "¿Migrar configuraciones del Widget?",
            }
          );
        } else {
          migrateConfig = dcu.getConfig(
            CONSTANTS.CONFIG.GENERAL,
            CONSTANTS.CONFIG.PROPS.MIGRATE_CONFIGS
          );
        }
        command = `dcu -x "${env.componentPath}" ${migrateConfig === CONSTANTS.NO ? " -o " : " "
          }`;
      } else {
        if (vscode.workspace.workspaceFolders.length == 0) {
          dcu.error("No hay carpetas abiertas");
          return;
        }

        let occFolders = vscode.workspace.workspaceFolders.filter((folder) => {
          let dir = fs.readdirSync(folder.uri.fsPath);
          return dir.indexOf(".ccc") != -1;
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
            placeHolder: "Seleccione un ambiente a donde migrar el widget",
          });
        }

        if (item) {
          let comp = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder:
              "widgetName/elementName/global/theme/snippet (En widgets y elementos se deben respetar mayusculas y minusculas)",
            prompt: "Que componente desea migrar?",
          });

          if (comp) {
            let folder;
            folder = occFolders.find((fold) => {
              return fold.name == item;
            });
            env = dcu.findEnvironment(folder.uri.path);
            env.componentName = comp;
            let migrateConfig;
            if (
              dcu.getConfig(
                CONSTANTS.CONFIG.GENERAL,
                CONSTANTS.CONFIG.PROPS.MIGRATE_CONFIGS
              ) === CONSTANTS.PREGUNTAR
            ) {
              migrateConfig = await vscode.window.showQuickPick(
                [CONSTANTS.SI, CONSTANTS.NO],
                {
                  placeHolder: "¿Migrar configuraciones del Widget?",
                }
              );
            } else {
              migrateConfig = dcu.getConfig(
                CONSTANTS.CONFIG.GENERAL,
                CONSTANTS.CONFIG.PROPS.MIGRATE_CONFIGS
              );
            }

            if (
              comp.toUpperCase() == CONSTANTS.COMPONENTS.GLOBAL.toUpperCase() ||
              comp.toUpperCase() == CONSTANTS.COMPONENTS.THEME.toUpperCase() ||
              comp.toUpperCase() == CONSTANTS.COMPONENTS.SNIPPET.toUpperCase()
            ) {
              command = `dcu -x "${comp.toLocaleLowerCase()}" ${migrateConfig === CONSTANTS.NO ? " -o " : " "
                }`;
            } else {
              let folderInfo = fs.readdirSync(folder.uri.fsPath + "/element");
              if (folderInfo.indexOf(comp) != -1) {
                command = `dcu -x "element/${comp}" ${migrateConfig === CONSTANTS.NO ? " -o " : " "
                  }`;
              } else {
                let folderInfo = fs.readdirSync(folder.uri.fsPath + "/widget");
                if (folderInfo.indexOf(comp) != -1) {
                  command = `dcu -x "widget/${comp}" ${migrateConfig === CONSTANTS.NO ? " -o " : " "
                    }`;
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
        placeHolder: "Seleccione el destino",
      });

      const envUrl = dcu.getConfig(
        CONSTANTS.CONFIG[dest],
        CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL
      );
      const envKey = dcu.getConfig(
        CONSTANTS.CONFIG[dest],
        CONSTANTS.CONFIG.PROPS.APP_KEY
      );

      if (!envKey || !envUrl) {
        dcu.error({
          msg: CONSTANTS.MSGS.TRANSFER_ERROR,
          detail: "No se encontró url o key de destino",
          replaceOptions: {
            componentName: env.componentName,
            destEnv: dest,
          },
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

        dcu.runCommand(
          transferFolder,
          env,
          {
            componentName: env.componentName,
            destEnv: dest,
          },
          (taskInfo) => {
            if (taskInfo[CONSTANTS.MGS_TYPES.WARN]) {
              dcu.warn({
                msg: "La migración arrojo algunas advertencias",
                items: ["VER"],
                callback: () => {
                  dcu.showOutput();
                },
              });
            }
          },
          null
        );
      }
    });

    async function migrateLayouts(component) {
      let origin = await vscode.window.showQuickPick(CONSTANTS.ENV.ALL, {
        ignoreFocusOut: true,
        placeHolder: "Seleccione el ORIGEN",
      });

      let dest = await vscode.window.showQuickPick(CONSTANTS.ENV.ALL, {
        ignoreFocusOut: true,
        placeHolder: "Seleccione el DESTINO",
      });

      if (origin == dest) {
        dcu.error("El origen no puede ser igual al destino");
        return;
      }

      let urlOrigin = dcu.getConfig(
        CONSTANTS.CONFIG[origin],
        CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL
      );
      let keyOrigin = dcu.getConfig(
        CONSTANTS.CONFIG[origin],
        CONSTANTS.CONFIG.PROPS.APP_KEY
      );
      let urlDest = dcu.getConfig(
        CONSTANTS.CONFIG[dest],
        CONSTANTS.CONFIG.PROPS.ENVIROMENT_URL
      );
      let keyDest = dcu.getConfig(
        CONSTANTS.CONFIG[dest],
        CONSTANTS.CONFIG.PROPS.APP_KEY
      );

      if (!urlOrigin || !keyOrigin || !urlDest || !keyDest) {
        dcu.error("Falta la URL o la APP_KEY del ambiente de ORIGEN o DESTINO");
        return;
      }

      dcu.warn({
        msg: `Recuerda migrar todos los widgets y las instancias asociadas a ${component ? "este layout" : "los layouts"
          }, antes de ejecutar la migración`,
        items: ["CONTINUAR", "CANCELAR"],
        callback: (res) => {
          if (res === "CONTINUAR") {
            let command = `plsu -n "${urlOrigin}" -k "${keyOrigin}" -d "${urlDest}" -a "${keyDest}" -t`;
            if (component && component != "*") {
              command += ` -y "${component}" `;
            } else if (component && component == "*") {
              command += ` -s `;
            }
            if (
              dcu.getConfig(
                CONSTANTS.CONFIG.GENERAL,
                CONSTANTS.CONFIG.PROPS.IGNORE_COMMERCE_VERSION
              )
            ) {
              command += " -g";
            }

            migrateLayout.task = command;
            dcu.runCommand(
              migrateLayout,
              null,
              {
                layoutName: component != "*" ? component : "todos los Layouts",
                destEnv: dest,
              },
              null,
              null
            );
          }
        },
      });
    }

    vscode.commands.registerCommand("plsu.y", async () => {
      let component = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "OCS_ProductDetails",
        prompt: "Que layout desea migrar? (Ingrese * para migrar todos)",
      });

      if (component) {
        migrateLayouts(component);
      } else {
        dcu.error({
          msg: "No se ingreso layout",
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
    // STORAGE.update(CONSTANTS.STORAGE.VERSION, "2.0.3");
    dcu.validateVersion(STORAGE);
    dcu.initializeFileTracking();
  } catch (e) {
    vscode.window.showErrorMessage("Error activando:" + e);
  }
}
exports.activate = activate;
