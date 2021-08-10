const Task = require("./Task");

const infoRequest = require("../controllers/infoRequest");
const CONST = require("../CONS/CONSTANTS.json");
const copyPaste = require("copy-paste");
const evalConfig = require("../controllers/dcu").evaluateConfig;

class Command extends Task {
	/**
	* 
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
	* 
	* @param {String}					[data.task]					- The command to execute in CMD
	* @param {String}					[data.translation]			- The language to analyze response
	* @param {String}					[data.cwd]					- Directory where to execute task
	*/
	constructor(data) {
		super(data);
		this.task = data.task;
		this.translation = data.translation || data.env.lang;
		this.cwd = data.cwd;

		evalConfig(CONST.CONFIG.DCU.NAME, CONST.CONFIG.DCU.PROPS.COPY_COMMAND).then((val) => {
			this.allowCopy = val;
		});
	}

	async copyCommand() {
		let result = await infoRequest.askTroughNotification({
			msg: "Error ejecutando el comando", //TODO MOVE AS CONSTANT
			options: "COPIAR COMANDO", //TODO MOVE AS CONSTANT
			type: CONST.MGS_TYPES.ERROR,
		});
		if (result) {
			copyPaste.copy(this.task);
		}
	}

	exec() {
		return new Promise((resolve, reject) => {
			try {
				this.runCmdCommand({
					task: this.task,
					cwd: this.cwd || this.env.basePath,
					skipHeader: false
				}).then(() => {
					resolve();
				}).catch(() => {
					if (this.allowCopy) {
						this.copyCommand();
					}
					reject();
				});
			} catch (e) {
				this.copyCommand();
				throw Error(e);
			}
		});
	}
}

module.exports = Command;
