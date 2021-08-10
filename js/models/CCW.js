const Task = require("./Task");
const CMD = require("./CMD");
const logger = require("../controllers/logger");
const utils = require("../utils");
const CONST = require("../CONS/CONSTANTS.json");
const { exec } = require("child_process");

class CCW extends Task {

	/**
	* Utility to create new widgets 
	* @param {Object} 					data 						- The task info 
	* @param {String} 					[data.name] 				- The task name
	* @param {import("./Environment")} 	data.env 					- The environment where is running the task,
	* @param {import("./DcuItemBar")} 	data.itemBar 				- The item bar asociated to the task. Provides functions such as ToggleSpinner
	* @param {Object}					data.messages				- Notification messages
	* @param {String}					data.messages.start			- Notification message for task init
	* @param {String}					data.messages.success		- Notification message for task success
	* @param {String}					data.messages.error			- Notification message for task error
	* @param {String}					[data.messages.trackingMsg]	- Notification message for task	tracking
	* @param {String}					[data.messages.warn]		- Notification message for task warning

	*@param {String}					data.widgetName				- New widget's name
	* @param {Boolean}					data.useElements			- Boolean to check if the new widget requires elelemts
	* @param {Array}					data.langs					- New widget's locales
	* @param {String}					data.cwd					- Current Work Directory
	* @param {String}					[data.ccwLang]				- The language of the console
	* @param {Array}					[data.questions]				- The wizzard of CCW
	*/
	constructor(data) {
		super(data);

		this.widgetName = data.widgetName;
		this.useElements = data.useElements;
		this.lang = data.langs;
		this.cwd = data.cwd || data.env.basePath;
		this.ccwLang = null;
		this.questions = []
	}


	determineLanguage() {
		return new Promise((resolve) => {
			let dcuProccess = exec(`ccw`, {
				cwd: this.cwd,
			});
			let data = "";

			dcuProccess.stdout.on("data", (d) => {
				data += `${d}`;
			});

			dcuProccess.on("close", async () => {
				for (let i in CONST.CCW.LANGUAGE_CHECKER) {
					if (data.indexOf(i) != -1) {
						this.ccwLang = CONST.CCW.LANGUAGE_CHECKER[i];
						this.questions = CONST.CCW.QUESTIONS[this.ccwLang];
						break;
					}
				}

				resolve();
			});
		});

	}

	createWidget() {
		return new Promise(async (resolve, reject) => {
			try {
				let task = this;
				task.name = "CREAR WIDGET";

				task.initTask({
					title: "CREACIÓN DE WIDGET",
					config: {
						Nombre: this.widgetName,
						Elementos: this.useElements ? "SI" : "NO",
						Idioma: this.lang.join(", ").toUpperCase(),
						Ambiente: this.env.env
					}
				});

				logger.doLog("Detectando idioma...", true);
				await this.determineLanguage();
				logger.doLog("Creando widget...", true);
				let count = 0;
				let answers = {
					en: [task.widgetName, "N", "Y", "Y", "N", task.useElements ? "Y" : "N", "N"],
					es: [task.widgetName, "N", "S", "S", "N", task.useElements ? "S" : "N", "N"]
				};

				let dcuProccess = exec(`ccw -w -k ${task.env.key}`, {
					cwd: task.cwd,
				});
				let stderr = "",
					data = "";

				dcuProccess.stdout.on("data", (d) => {
					try {

						if (!dcuProccess.killed) {
							data += `${d}`;
							if (data.toString().indexOf(CONST.CCW.ALREADY_EXISTS[this.env.lang]) != -1) {
								task.errorFlag = true;
								task.errorMsg = "El widget ya existe";
								logger.doLog("El widget ya existe", true);

								dcuProccess.kill();
								process.kill(dcuProccess.pid);

								return;
							} else if (count == 0 && d.toString().toUpperCase().replace(/\n/g, "").indexOf(this.questions[0]) != -1) {
								dcuProccess.stdin.write(answers.es[count] + "\n");
								count++;
								this.questions.shift();
							} else if (count > 0 && d.toString().toUpperCase().replace(/\n/g, "").indexOf(this.questions[0] + " (S/N)") != -1) {
								dcuProccess.stdin.write(answers.es[count] + "\n");
								count++;
								this.questions.shift();
							} else if (count > 0 && d.toString().toUpperCase().replace(/\n/g, "").indexOf(this.questions[0] + " (Y/N)") != -1) {
								dcuProccess.stdin.write(answers.en[count] + "\n");
								count++;
								this.questions.shift();
							}
						}
					} catch (e) {
					}
				});

				dcuProccess.stderr.on("data", (d) => {
					logger.doLog(d.toString().trim(), true);
					stderr += `${d}`;
				});

				dcuProccess.on("close", async (code) => {
					try {
						var taskInfo = task.analyzeResponse({
							data: data,
							error: task.errorFlag ? task.errorMsg : stderr,
							sterror: stderr,
							code: task.errorFlag ? 1 : code ? code : 0,
						});

						if (taskInfo.STATUS == CONST.STATUS.SUCCESS) {
							try {
								await this.cleanLocales();
								await this.renameFiles();
								await this.uploadWidget();
								task.taskSuccess();
								resolve(taskInfo);
							} catch (e) {
								task.taskFailed();
								reject(e);
							}
						} else if (taskInfo.STATUS == CONST.STATUS.FAIL) {
							task.taskFailed();
							reject(taskInfo)
						}
					} catch (e) {
						reject(e);
					}
				});
			} catch (e) {
				throw Error(e);
			}
		});
	}

	cleanLocales() {
		return new Promise((resolve, reject) => {
			try {
				logger.doLog("Limpiando locales innecesarios...", true);
				let widgetPath = `${this.cwd}/widget/${this.widgetName}`;
				let configLocalePath = widgetPath + "/config/locales";
				let widgetLocalePath = widgetPath + "/locales";
				utils.removeFiles(configLocalePath, this.lang);
				utils.removeFiles(widgetLocalePath, this.lang);
				resolve();
			} catch (e) {
				logger.doLog("Error eliminando locales", true);
				logger.doLog(JSON.stringify(e));
				reject();
			}
		});
	}

	renameFiles() {
		return new Promise(async (resolve, reject) => {
			try {
				logger.doLog("Renombrando archivos...", true);
				let widgetPath = `${this.cwd}/widget/${this.widgetName}`;
				let cccWidgetPath = `${this.cwd}/.ccc/widget/${this.widgetName}`;
				// let cccWidgetPath = `${this.cwd}/.ccc/widget/${this.widgetName}`;
				// let javascriptPath = `${widgetPath}/js/${this.widgetName.toLocaleLowerCase()}.js`;
				utils.renameFile(`${widgetPath}/js/${this.widgetName.toLocaleLowerCase()}.js`, `${widgetPath}/js/${this.widgetName}.js`);
				this.lang.forEach(ln => {
					utils.renameFile(`${widgetPath}/locales/${ln}/ns.${this.widgetName.toLocaleLowerCase()}.json`, `${widgetPath}/locales/${ln}/ns.${this.widgetName}.json`);
				});
				logger.doLog("Archivos renombrados!", true);

				logger.doLog("Corrigiendo widgetMetadata.json...");
				let widgetMetadata = JSON.parse(utils.readFile(`${widgetPath}/widgetMetadata.json`));
				widgetMetadata.translations.forEach(translation => translation.name = this.widgetName);
				widgetMetadata.javascript = `${this.widgetName}`;
				widgetMetadata.i18nresources = `${this.widgetName}`;
				await utils.writeFile(`${widgetPath}/widgetMetadata.json`, widgetMetadata);
				await utils.formatFile(`${widgetPath}/widgetMetadata.json`);

				let cccwidgetMetadata = JSON.parse(utils.readFile(`${cccWidgetPath}/widget.json`));
				cccwidgetMetadata.javascript = `${this.widgetName}`;
				cccwidgetMetadata.i18nresources = `${this.widgetName}`;
				await utils.writeFile(`${cccWidgetPath}/widget.json`, cccwidgetMetadata);
				await utils.formatFile(`${cccWidgetPath}/widget.json`);

				await utils.closeFile();
				await utils.closeFile();

				resolve();
			} catch (e) {
				reject();
			}
		});
	}

	uploadWidget() {
		return new Promise((resolve, reject) => {
			try {
				logger.doLog("Subiendo widget a " + this.env.env + "...");
				let command = `dcu -m "widget/${this.widgetName}" -k ${this.env.key}`;
				this.logInit({
					command: command,
					skipHeader: true
				});

				let cmd = new CMD({
					task: command,
					cwd: this.cwd
				});

				cmd.run().then(res => {
					try {
						var taskInfo = this.analyzeResponse(res);
						if (taskInfo.STATUS == CONST.STATUS.SUCCESS) {
							resolve();
						} else if (taskInfo.STATUS == CONST.STATUS.FAIL) {
							reject();
						}
					} catch (e) {
						logger.doLog("Error subiendo widget", true);
						logger.doLog(JSON.stringify(e), true);
						reject(e);
					}
				}).catch(err => {
					logger.doLog("Error subiendo widget", true);
					logger.doLog(JSON.stringify(err), true);
					reject(err);
				});
			} catch (e) {
				logger.doLog("Error subiendo widget", true);
				logger.doLog(JSON.stringify(e), true);
				reject(e);
			}
		})
	}
}

module.exports = CCW;