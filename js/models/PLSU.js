// const Task = require("./Task");
const Command = require("./Command");
const OCC = require("./OCC");

const utils = require("../utils");
const logger = require("../controllers/logger");
const infoRequest = require("../controllers/infoRequest");
const CONSTANTS = require("../CONS/CONSTANTS.json");
const TEXTS = require("../CONS/TEXTS.json");
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
	* @param {Boolean}					data.loadLayouts				- True if fetch layouts from occ
	* @param {Boolean}					data.preserveMetadata			- True if save/restore layout metadata

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
	* @param {Boolean} 					[data.preserveMetadata]			- Keep layout's destination metadata
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
		 * @type {Array}
		 */
		this.selectedLayouts = [];

		/**
		 * Ignore commerce version when migrate
		 * @type {Boolean}
		 */
		this.ignoreCommerceVersion = data.ignoreCommerceVersion;

		/**
		 * Keep destination metadata
		 * @type {Boolean}
		 */
		this.preserveMetadata = data.preserveMetadata;


		/**
		 * List of Layout's names
		 * @type {Array}
		 */
		this.layoutsNames = [];

		/**
		 * List of Layout's definition
		 * @type {Object}
		 * 
		 */
		this.layoutsDefinitions = null;

		/**
		 * Object with Layout's metadata
		 * @type {Object}
		 */
		this.layoutsMetadata = {};

		/**
		 * Site's language
		 * @type {Array}
		 */
		this.siteLanguages = [];

		/**
		 * @type {Boolean}
		 */
		this.loadLayouts = data.loadLayouts;

		/**
		 * @type {Boolean}
		 */
		this.preserveMetadata = data.preserveMetadata;
	}

	async selectLayouts() {
		try {
			let pickLayoutsResponse;
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

				this.layoutsNames = layouts.map(layout => layout.name);
				pickLayoutsResponse = await infoRequest.quickPickMany(this.layoutsNames, TEXTS.TRANSFER_LAYOUT.PICK_LAYOUTS);

				if (this.preserveMetadata) {
					let destOcc = new OCC({
						node: this.destination.node,
						key: this.destination.key
					});

					let destLayouts = await destOcc.fetchLayouts();

					if (typeof destLayouts === "string") {
						this.setError(destLayouts);
						return;
					}

					this.layoutsDefinitions = {};
					destLayouts.forEach(layout => {
						this.layoutsDefinitions[layout.name] = layout.id;
					});
				}

			} else {
				let inputLayouts = await infoRequest.showInputBox(TEXTS.TRANSFER_LAYOUT.INPUT_LAYOUTS);
				// if (!selectedLayouts) {
				// 	// this.setError("No se seleccionaron Layouts");
				// 	this.taskIncomplete("No se seleccionaron Layouts");
				// 	return;
				// };
				pickLayoutsResponse = inputLayouts.trim().split(",");
				this.layoutsNames = pickLayoutsResponse;
			}

			if (!pickLayoutsResponse) {
				// this.setError("No se seleccionaron Layouts");
				this.taskIncomplete("No se seleccionaron Layouts");
				return;
			}

			this.selectedLayouts = pickLayoutsResponse;
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

			if (Array.isArray(this.selectedLayouts)) {
				if (this.selectedLayouts.includes("*") && this.selectedLayouts.length > 1) {
					this.setError("No puede migrar todos los layouts (*) si elige mas de uno"); //TODO MOVE AS CONSTANT
					return;
				} else if (this.selectedLayouts.includes("*") && this.selectedLayouts.length == 1) {
					msgLayoutName = "todo";
					this.task += ` -s`;
				} else {
					msgLayoutName = this.selectedLayouts.length == 1 ? this.selectedLayouts[0] : "varios layouts"; //TODO MOVE AS CONSTANT
					this.selectedLayouts.forEach((l) => {
						this.task += ` -y "${l}"`;
					});
				}
			}

			return msgLayoutName;
		} catch (e) {
			this.setError(e);
		}
	}

	saveMetadata() {
		return new Promise(async (resolve, reject) => {
			try {
				let occ = new OCC({
					node: this.destination.node,
					key: this.destination.key,
				});

				let langs = await infoRequest.quickPickMany(CONSTANTS.LOCALE_LIST, "Seleccione los lenguajes que administra en el sitio");
				if (!langs) {
					this.setError("No se seleccionaron idiomas");
					return;
				}

				this.siteLanguages = langs;

				for (let layout of this.selectedLayouts) {
					let layoutId = this.layoutsDefinitions[layout];

					if (layoutId) {
						for (let lang of langs) {
							let metadata = await occ.get({
								url: `${occ.ENDPOINTS.LAYOUTS}/${layoutId}`,
								msg: `Resguardando metadata en ${lang.toUpperCase()} para el layout ${layout.toUpperCase()}`,
								headers: {
									"X-CCAsset-Language": lang
								}
							});
							if (!this.layoutsMetadata[layoutId]) {
								this.layoutsMetadata[layoutId] = {};
							}

							this.layoutsMetadata[layoutId][lang] = {
								defaultPage: metadata.defaultPage,
								displayName: metadata.displayName,
								layoutViewports: metadata.layoutViewports,
								metaTags: metadata.metaTags,
								pageAddress: metadata.pageAddress,
								pageDisplayName: metadata.pageDisplayName,
								pageTitle: metadata.pageTitle,
								sites: metadata.sites,
								supportedDevices: metadata.supportedDevices,
								target: metadata.target
							}
						}
					}
				}

				resolve();
			} catch (e) {
				reject(e);
			}
		});

	}

	restoreMetadata() {
		return new Promise(async (resolve, reject) => {
			try {
				let occ = new OCC({
					node: this.destination.node,
					key: this.destination.key,
				});

				let errors = [];

				for (let layout in this.layoutsMetadata) {
					for (let lang in this.layoutsMetadata[layout]) {
						let metadata = this.layoutsMetadata[layout][lang];

						try {
							let uptaded = await occ.put({
								url: `${occ.ENDPOINTS.LAYOUTS}/${layout}`,
								data: {
									properties: metadata
								},
								headers: {
									"X-CCAsset-Language": lang
								},
								msg: `Restaurando metadata en ${lang.toUpperCase()} para el layout ${layout.toUpperCase()}`
							});

							if (uptaded) {
								logger.doLog(`${layout.toUpperCase()} en ${lang.toUpperCase()} restaurado correctamente`);
							}
						}
						catch (error) {
							errors.push({
								layout: layout,
								lang: lang,
								metadata: metadata
							});
						}
					}
				}


				logger.doLog("", false);

				if (errors.length > 0) {
					infoRequest.copyToClipboard("Ocurrieron algunos errores al restaurar la información. ¿Quieres copiar la metadata?", errors, CONSTANTS.MGS_TYPES.WARN);
				}


				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}
}

module.exports = PLSU;