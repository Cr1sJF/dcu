const Task = require("./Task");

const logger = require("../controllers/logger");
const ENDPOINTS = require("../CONS/ENDPOINTS.json");
const utils = require("../utils");
const FormData = require('form-data');
const fs = require('fs');
const OCC = require("./OCC");

const waitingMessages = [
	"Subiendo...",
	"Todavia subiendo...",
	"Se sigue subiendo...",
	"Ya casi eh...",
	"Invirtiendo escalafón profesional...",
	"Preparando café...",
	"Incremento de las conductas laborales...",
	"Cargando..."
];

const longWaitingMessages = [
	"Activando personal hotelero...",
	"Bueno...",
	"Desinvitando a Juan Tenorio...",
	"Esto está tardando mas de lo que deberia...",
	"En cualquier momento tira timeout...",
	"Aguarda mientras los minions hacen el trabajo",
	"Descargando minions extra...",
	"Estamos trabajando arduamente, posta",
	"Despertando minions",
	"Tienes el numero 2843684714 en la fila",
	"Aguarda mientras atendemos otros clientes...",
	"Nuestro plan premium es mas rapido",
]

/**
 *  @extends Task
 */
class SSE extends Task {
	/**
	  * SSE object. Used to upload, download and delete SSEs
	* @constructor

	* @param {Object} 					data 					- The task info 
	* @param {String} 					[data.name] 			- The task name
	* @param {import("./Environment")} 	data.env 				- The environment where is running the task,
	* @param {import("./DcuItemBar")} 	data.itemBar 			- The item bar asociated to the task. Provides functions such as 
	* @param {Object}					[data.messages]				- Notification messages
	* @param {String}					data.messages.start			- Notification message for task init
	* @param {String}					data.messages.success		- Notification message for task success
	* @param {String}					data.messages.error			- Notification message for task error
	* @param {String}					[data.messages.trackingMsg]	- Notification message for task	tracking
	* @param {String}					[data.messages.warn]		- Notification message for task warning
	
	* @param {String} 					[data.name] 		- The task name
	* @param {import("./Environment")} 	data.env 			- The environment where is running the task,
	* @param {import("./DcuItemBar")} 	data.itemBar 		- The item bar asociated to the task. Provides functions such as ToggleSpinner
	* @param {Object} 					[data.zip] 			- The SSE's .zip file
	* @param {String} 					[data.zipPath] 		- The zip's path
	*/
	constructor(data) {
		super(data);
		this.zip = data.zip;
		if (data.zip) {
			this.zipPath = utils.cleanPath(data.zip.path);
		}

		/**
		 * OCC Conector
		 * @type {OCC}
		 */
		this.occ = new OCC({
			node: this.env.node,
			key: this.env.key
		});

		if (!data.env) {
			this.setError("No se asigno un ambiente");
		}
	}

	async upload() {
		return new Promise(async (resolve, reject) => {
			try {
				this.initTask({
					title: "SUBIENDO SSE",
					config: {
						"Nombre": this.name,
						"Ruta del archivo": this.zipPath,
						"Ambiente": this.env.env
					}
				});

				let form = new FormData();
				form.append('uploadType', 'extensions');
				form.append('force', 'true');
				form.append('filename', this.name);
				form.append('fileUpload', fs.createReadStream(this.zipPath));

				logger.doLog("Subiendo archivo...", true);
				let initMsg = [].concat(waitingMessages);
				let tooLong = [].concat(longWaitingMessages);

				let interval = setInterval(() => {
					if (initMsg.length > 0) {
						let index = Math.floor(Math.random() * (initMsg.length - 0));
						logger.doLog(initMsg[index], true);
						initMsg.splice(index, 1);
					} else {
						let index = Math.floor(Math.random() * (tooLong.length - 0));
						logger.doLog(tooLong[index], true);
						tooLong.splice(index, 1);
					}
				}, 2500);

				try {
					let uploadFileStatus = await this.occ.post({
						url: ENDPOINTS.SSE.POST_SSE,
						data: form,
						headers: form.getHeaders(),
						extendTimeOut: true
					});
					clearInterval(interval);

					if (uploadFileStatus.success) {
						logger.doLog("Todo listo!", true);
						this.taskSuccess();
						resolve();
					} else {
						logger.doLog("Error subiendo SSE", true);
						logger.doLog(uploadFileStatus.data, true);
						this.taskFailed();
						reject();
					}

				} catch (e) {
					clearInterval(interval);
					logger.doLog("Error subiendo SSE", true);
					this.taskFailed();
					reject();
				}

			} catch (e) {
				logger.doLog("Error subiendo SSE", true);
				this.taskFailed();
				reject();
			}
		});
	}

	async delete(sseName) {
		return new Promise(async (resolve, reject) => {
			try {
				super.name = sseName;
				this.initTask({
					title: "ELIMINAR SSE",
					config: {
						"Ambiente": this.env.env,
						"SSE": this.name
					}
				});

				logger.doLog("Eliminando SSE...", true);
				let deleteStatus = await this.occ.delete({
					url: ENDPOINTS.SSE.DOWNLOAD_SSE,
					pathParam: {
						SSE_ID: this.name
					},
					extendTimeOut: true
				});

				if (deleteStatus.success) {
					logger.doLog("SSE eliminiada!", true);
					this.taskSuccess();
					resolve();
				} else {
					logger.doLog("Error eliminando SSE", true);
					logger.doLog(deleteStatus.data, true);

					this.taskFailed();
					reject();
				}
			} catch (e) {
				logger.doLog("Error eliminando SSE", true);
				logger.doLog(JSON.stringify(e), true);

				this.taskFailed();
				reject();
			}
		});
	}

	async fetchSSE() {
		try {
			let SSEs = await this.occ.get({
				url: ENDPOINTS.SSE.GET_SSE,
				msg: "Buscando SSEs..."
			});

			return SSEs.map(sse => {
				return sse.name
			});
		} catch (e) {
			logger.logError(JSON.stringify(e));
			return null;
		}
	}

	async downloadSSE(sseName, path) {
		return new Promise(async (resolve, reject) => {
			try {
				this.name = sseName;
				this.zipPath = `${path}/${sseName}`;

				this.itemBar.toggleSpinIcon();
				this.initTask({
					title: "DESCARGA SSE",
					config: {
						"Ambiente": this.env.env,
						"SSE": this.name,
						"Ruta": this.zipPath
					}
				});

				let zipFile = await this.occ.get({
					url: ENDPOINTS.SSE.DOWNLOAD_SSE,
					pathParam: {
						SSE_ID: this.name
					},
					config: {
						responseType: "stream",
					},
					extendTimeOut: true,
					msg: "Obteniendo SSE..."
				});

				logger.doLog("SSE obtenida!", true);
				logger.doLog("Escribiendo archivo...", true);

				const writer = fs.createWriteStream(this.zipPath);

				zipFile.pipe(writer);
				writer.on("finish", () => {
					logger.doLog("Archivo .zip generado correctamente", true);
					writer.close();
					writer.end();
					writer.destroy();
					this.taskSuccess();
					resolve();
				});
				writer.on("error", (err) => {
					logger.doLog(JSON.stringify(err), true);

					this.taskFailed();
					reject();
				});
			} catch (e) {
				logger.doLog("Error descargando SSE", true);
				logger.doLog(JSON.stringify(e));
				this.taskFailed();
				reject();
			}
		})
	}
}

module.exports = SSE;