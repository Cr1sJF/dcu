const CMD = require("./CMD");
const logger = require("../controllers/logger");
const CONST = require("../CONS/CONSTANTS.json");
const fileTracking = require("../controllers/fileTracking");
const keywords = require(`../CONS/KEYWORDS.json`);
const utils = require("../utils");
/**
 * @constructor
 */
class Task {
	/**
	 * Task object. Recives minimal props of a task. This object is the parent of Command, PLSU, SSE, ThirdParty
	 * 
	 * @param {Object} 					data 						- The task info 
	 * @param {String} 					[data.name] 				- The task name
	 * @param {import("./Environment")} data.env 					- The environment where is running the task,
	 * @param {import("./DcuItemBar")} 	data.itemBar 				- The item bar asociated to the task. Provides functions such as ToggleSpinner
	 * @param {Function}				[data.successCallback]		- Function to execute when commands succeeds
	 * @param {Function}				[data.failCallback]			- Function to execute when commands fails
	 * @param {Object}					[data.messages]				- Notification messages
	 * @param {String}					data.messages.start			- Notification message for task init
	 * @param {String}					data.messages.success		- Notification message for task success
	 * @param {String}					data.messages.error			- Notification message for task error
	 * @param {String}					[data.messages.trackingMsg]	- Notification message for task	tracking
	 * @param {String}					[data.messages.warn]		- Notification message for task warning
	 */
	constructor(data) {
		this.name = data.name;
		this.env = data.env;
		this.itemBar = data.itemBar;
		this.errorFlag = false;
		this.errorMsg = "";

		if (data.messages) {
			this.messages = {
				start: data.messages.start || "",
				success: data.messages.success || "",
				error: data.messages.error || "",
				warn: data.messages.warn || ""
			};
		}

		this.successCallback = data.successCallback;
		this.failCallback = data.failCallback;

	}

	/**
	 * Set error in Task
	 * @param {String} msg 
	 * @returns {Void}
	 */
	setError(msg) {
		if (!this.errorFlag) {
			this.errorFlag = true;
			this.errorMsg = msg;
			logger.log({
				text: msg,
				type: logger.LOG
			});
		}
	}

	/**
	 * Initializa itemBar and write first logs
	 * @param {Object} 	config 				- Configuration for the log
	 * @param {String} 	[config.title] 		- The title for this section
	 * @param {Object} 	[config.config] 	- Object of type label/value to print task's config
	 * @param {String} 	[config.command] 	- The dcu's command
	 * @param {Boolean} [config.skipHeader] - Boolean to skip the header. Usefull when a task has more than one command
	 */
	initTask(config) {
		this.itemBar.toggleSpinIcon();
		this.logInit(config);
	}

	taskSuccess() {
		this.logSuccess();
		this.itemBar.success();
	}

	taskFailed() {
		this.logFail();
		this.itemBar.fail();
	}

	taskWarn() {
		this.logWarn();
		this.itemBar.warn();
	}

	taskIncomplete(reason) {
		logger.doLog(reason);
		logger.logResultAndWarn("incomplete", logger.RESULT);
		logger.log({ text: 0, type: logger.END_SECTION });
		this.itemBar.fail();
	}

	/**
	 * Logs in console the beginning of a task
	 * @param {Object} 	logConfig 				- Configuration for the log
	 * @param {String} 	[logConfig.title] 		- The title for this se
	 * ction
	 * @param {Object} 	[logConfig.config] 		- Object of type label/value to print task's config
	 * @param {String} 	[logConfig.command] 	- The dcu's command
	 * @param {Boolean} [logConfig.skipHeader] 	- Boolean to skip the header. Usefull when a task has more than one command
	 */
	logInit(logConfig) {
		if (!logConfig.skipHeader) {
			logger.logInfo(logConfig.title, logger.SECTION);
		}

		if (logConfig.config) {
			logger.log({ type: logger.TITLE, text: "CONFIGURACIÓN:" });
			Object.entries(logConfig.config).forEach(([key, value], index) => {
				logger.doLog(`${key}${" ".repeat(20 - key.length)}=> ${value}`, index != Object.entries(logConfig.config).length - 1);
			});
		}

		if (logConfig.command) {
			logger.log({ type: logger.TITLE, text: "COMMAND:" });
			logger.log({ type: logger.LOG, text: logConfig.command });
		}

		logger.log({ type: logger.TITLE, text: "RESPONSE:" });
	}

	/**
	 * Logs successfull executed task
	 */
	logSuccess() {
		fileTracking.track(this.messages.tracking);
		logger.logResultAndWarn(CONST.STATUS.SUCCESS);
		logger.log({ text: 0, type: logger.END_SECTION });
	}

	/**
	 * Logs successfull executed task
	 */
	logFail() {
		logger.logResultAndWarn(CONST.STATUS.FAIL);
		logger.log({ text: 0, type: logger.END_SECTION });
	}

	/**
	 * Logs Warning when task has not identified status 
	 */

	logWarn() {
		logger.logResultAndWarn(CONST.STATUS.WARN, "No se logró determinar el status de la tarea, revise el log");
		logger.log({ text: 0, type: logger.END_SECTION });
	}

	/**
	 * Runs CMD commands
	 * @param {Object} options - The Command configuration
	 * @param {String} options.task - The task to execute: Ej: dcu -e <widget>
	 * @param {Boolean} options.skipHeader - Runs command without logging the header section
	 * @param {String} options.cwd - Work directory where execute the task (Overrites the Environment basePath)
	 * 
	 * @returns {Promise} Promise who tells the status of the task's execusion. resolve when success, reject when fails or execption
	 */
	runCmdCommand(options) {
		return new Promise((resolve, reject) => {
			try {
				let task = this;
				task.initTask({
					title: task.name,
					command: options.task,
					skipHeader: options.skipHeader
				});

				let cmd = new CMD({
					task: options.task,
					cwd: options.cwd || this.env.basePath
				});

				cmd.run().then(async (response) => {
					var taskInfo = this.analyzeResponse(response);

					if (taskInfo.STATUS == CONST.STATUS.SUCCESS) {

						if (this.successCallback) {
							await this.successCallback();
						}

						task.taskSuccess();
						resolve(taskInfo);
					} else if (taskInfo.STATUS == CONST.STATUS.FAIL) {
						if (this.failCallback) {
							await this.failCallback();
						}
						task.taskFailed();
						reject(taskInfo);
					} else if (taskInfo.STATUS == CONST.STATUS.WARN) {
						if (this.successCallback) {
							await this.successCallback();
						}
						task.taskWarn();
						resolve(taskInfo);
					}
				}).catch(async (error) => {
					if (this.failCallback) {
						await this.failCallback();
					}
					task.taskFailed();
					reject(error);
				})
			} catch (e) {
				throw Error(e);
			}
		})
	}

	analyzeResponse(data) {
		if (data.code == 1) {
			return {
				ERROR: data.error,
				STATUS: CONST.STATUS.FAIL,
			};
		}

		let response = {};

		for (var key in keywords[this.env.lang]) {
			if (data.sterror.indexOf(key) != -1) {
				response[keywords[this.env.lang][key]] ? (response[keywords[this.env.lang][key]] += "\n" + data.sterror) : (response[keywords[this.env.lang][key]] = data.sterror);
			}
		}
		response.INFO ? (response.INFO += "\n" + data.data) : (response.INFO = data.data);

		if (response.ERROR) {
			response.STATUS = CONST.STATUS.FAIL;
		} else if (response.WARN) {
			response.STATUS = CONST.STATUS.WARN;
		} else {
			response.STATUS = CONST.STATUS.SUCCESS;
		}

		return response;
	}

	/**
	 * @param {Object} replaceData - Data to replace \@\@ in messages
	 */
	registerMessages(replaceData) {
		this.messages.init = utils.replace(this.itemBar.MSGS.START, replaceData);
		this.messages.success = utils.replace(this.itemBar.MSGS.SUCCESS, replaceData);
		this.messages.error = utils.replace(this.itemBar.MSGS.ERROR, replaceData);
		this.messages.warn = utils.replace(this.itemBar.MSGS.ERROR, replaceData);
		this.messages.tracking = utils.replace(this.itemBar.MSGS.trackingMsg, replaceData);
	}

}

module.exports = Task;