// const Task = require("./Task");
const Command = require("./Command");
const OCC = require("./OCC");

const utils = require("../utils");
const logger = require("../controllers/logger");
const infoRequest = require("../controllers/infoRequest");
const CONSTANTS = require("../CONS/CONSTANTS.json");
// const dcu = require("../controllers/dcu");

/**
 *  @extends Command
 *  @todo Keep metadata on destination
 */
class PLSU extends Command {
	/**
	* @constructor
	* @param {Object} data 
	* 
	* @param {String} 					[data.name] 					- The task name
	* @param {import("./Environment")} 	data.env 						- The environment where is running the task,
	* @param {import("./DcuItemBar")} 	data.itemBar 					- The item bar asociated to the task. Provides functions such as ToggleSpinner

	* @param {Object}					data.messages					- Notification messages
	* @param {String}					data.messages.start				- Notification message for task init
	* @param {String}					data.messages.success			- Notification message for task success
	* @param {String}					data.messages.error				- Notification message for task error
	* @param {String}					[data.messages.trackingMsg]		- Notification message for task	tracking
	* @param {String}					[data.messages.warn]			- Notification message for task warning
	* 	
	* @param {import("./Environment")} 	data.origin						- Origin Environment
	* @param {import("./Environment")} 	data.destination				- Destination Environment
	* @param {Boolean} 					[data.ignoreCommerceVersion]	- Ignore commerce version when transfer layouts
	*/
	constructor(data) {
		super(data);

		/**
		 * Env Origin
		 * @type {import("./Environment")}
		 */
		this.origin = data.origin;

		/**
		 * Env Destination
		 * @type {import("./Environment")}
		 */
		this.destination = data.destination;

		/**
		 * Layouts to migrate
		 * @type {Array<String> | String}
		 */
		this.layouts = [];

		/**
		 * Ignore commerce version when migrate
		 * @type {Boolean}
		 */
		this.ignoreCommerceVersion = data.ignoreCommerceVersion;
	}

	async selectLayouts() {
		try {
			let selectedLayouts;
			let loadLayouts = utils.getConfig(CONSTANTS.CONFIG.PLSU.NAME, CONSTANTS.CONFIG.PLSU.PROPS.FETCH_LAYOUTS);
			if (loadLayouts) {
				let occ = new OCC({
					node: this.env.node,
					key: this.env.key,
				});

				let layouts = await occ.fetchLayouts();
				if (typeof layouts === "string") {
					this.setError(layouts);
					return;
				}
				selectedLayouts = await infoRequest.quickPickMany(layouts, "Seleccione el layout (* para todos). Puede seleccionar mas de uno"); //TODO MOVE AS CONSTANT
			} else {
				selectedLayouts = await infoRequest.showInputBox("Seleccione el layout (* para todos, valores separados por ',' para mas de uno)"); //TODO MOVE AS CONSTANT
				// if (!selectedLayouts) {
				// 	// this.setError("No se seleccionaron Layouts");
				// 	this.taskIncomplete("No se seleccionaron Layouts");
				// 	return;
				// };
				selectedLayouts = selectedLayouts.trim().split(",");
			}

			if(!selectedLayouts){
				// this.setError("No se seleccionaron Layouts");
				this.taskIncomplete("No se seleccionaron Layouts");
				return;
			}

			this.layouts = selectedLayouts;
		} catch (e) {
			logger.logError(e.message);
			logger.postError({
				source: "dcu.fetchLayouts",
				error: e.message,
				stack: e.stack,
			});
			return;
		}
	};

	buildCommand() {
		try {
			let msgLayoutName = "";
			this.task = `plsu -n "${this.origin.node}" -k "${this.origin.key}" -d "${this.destination.node}" -a "${this.destination.key}" ${this.ignoreCommerceVersion ? " -g " : ""} -t `;

			if (Array.isArray(this.layouts)) {
				if (this.layouts.includes("*") && this.layouts.length > 1) {
					this.setError("No puede migrar todos los layouts (*) si elige mas de uno"); //TODO MOVE AS CONSTANT
					return;
				} else if (this.layouts.includes("*") && this.layouts.length == 1) {
					msgLayoutName = "todo";
					this.task += ` -s`;
				} else {
					msgLayoutName = this.layouts.length == 1 ? this.layouts[0] : "varios layouts"; //TODO MOVE AS CONSTANT
					this.layouts.forEach((l) => {
						this.task += ` -y "${l}"`;
					});
				}
			}

			return msgLayoutName;
		} catch (e) {
			this.setError(e);
		}
	}
}

module.exports = PLSU;