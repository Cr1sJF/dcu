const Task = require("./Task");
const OCC = require("./OCC");

const logger = require("../controllers/logger");
const infoRequest = require("../controllers/infoRequest");
const CONSTANTS = require("../CONS/CONSTANTS.json");

class ThirdParty extends Task {
	/**
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
	
	ToggleSpinner
	* @param {String}					[data.path]				- Path del archivo a subir
	* @param {String}					[data.fileName]			- Nombre el archivo a subir
	* @param {String}					[data.base64]				- Archivo convertido en base64
	* @param {String}					[data.site]				- ID del sitio donde se va a subir el archivo
	* @param {String}					[data.folder]				- Carpeta donde se va a subir el archivo
	* @param {String}					[data.thirdPartyPath] 	- Ruta relativa del archivo en OCC
	* @param {String}					[data.thirdPartyFullPath] - Ruta completa del archivo en OCC
	*/
	constructor(data) {
		super(data);

		/**
		 * Path
		 * @type {String}
		 */
		this.path = data.path;

		/**
		 * File Name
		 * @type {String}
		 */
		this.fileName = data.fileName;

		/**
		 * File converted to Base64
		 * @type {String}
		 */
		this.base64 = data.base64;

		/**
		 * OCC siteId
		 * @type {String}
		 */
		this.site = data.site;

		/**
		 * Folder
		 * @type {String}
		 */
		this.folder = data.folder;

		/**
		 * The new file Token
		 * @type {String}
		 */
		this.fileToken = null;

		/**
		 * File's OCC's relative path
		 * @type {String}
		 */
		this.thirdPartyPath = data.thirdPartyPath;

		/**
		 * File's OCC's full path
		 * @type {String}
		 */
		this.thirdPartyFullPath = data.thirdPartyFullPath;

		if (!data.env) {
			this.setError("Missing ENV");
		}

		/**
		 * OCC API Conector
		 * @type {OCC}
		 */
		this.occ = new OCC({
			node: this.env.node,
			key: this.env.key
		});
	}

	async upload() {
		return new Promise(async (resolve, reject) => {
			try {
				await this.occ.setSite(this.site);
				let folders = await this.fetchFolders();
				let selectedFolder = await infoRequest.quickPick(folders, "Seleccione la carpeta de destino");
				if (!selectedFolder) {
					this.taskIncomplete("No se selecciono carpeta de Destino");
					reject();
					return;
				}

				this.folder = selectedFolder == "/" ? "" : selectedFolder;
				if (selectedFolder == CONSTANTS.NUEVA) {
					let folderName = await infoRequest.showInputBox("Ingrese el nombre de la carpeta nueva. (Se creará dentro de /thirdparty", "Ej: /libraries, assets, /fonts");
					if (!folderName) {
						this.taskIncomplete("No se cargo el nombre de la carpeta nueva");
						reject();
						return;
					}

					folderName = folderName.startsWith("/") ? folderName.substring(1) : folderName;
					this.folder = folderName;
					this.thirdPartyFullPath = `/thirdparty/${this.folder}/${this.fileName}`;
					this.thirdPartyPath = `/${this.folder}/${this.fileName}`;

					this.initTask({
						title: "SUBIENDO ARCHIVO",
						config: {
							"Nombre": this.fileName,
							"Ruta": this.thirdPartyFullPath,
							"Ambiente": this.env.env,
							"Sitio": this.site ? this.site : "TODOS",
						}
					});

					let createFolderStatus = await this.createFolder(folderName);
					if (!createFolderStatus.success) {
						this.taskIncomplete(`Error creando la carpeta ${folderName}`);
						reject();
						return;
					}
					this.folder = folderName;
				} else {
					if (this.folder) {
						this.thirdPartyFullPath = `/thirdparty/${this.folder}/${this.fileName}`;
						this.thirdPartyPath = `/${this.folder}/${this.fileName}`;
					} else {
						this.thirdPartyFullPath = `/thirdparty/${this.fileName}`;
						this.thirdPartyPath = `/${this.fileName}`;
					}

					this.initTask({
						title: "SUBIENDO ARCHIVO",
						config: {
							"Nombre": this.fileName,
							"Ruta": this.thirdPartyFullPath,
							"Ambiente": this.env.env,
							"Sitio": this.site ? this.site : "TODOS",
						}
					});
				}

				let uploadFileStatus = await this.putFile();
				if (uploadFileStatus.success) {
					this.taskSuccess();
					resolve();
				} else {
					this.taskFailed();
					reject();
				}

			} catch (e) {
				logger.doLog(e)
				reject();
			}
		});
	}

	async delete() {
		return new Promise(async (resolve, reject) => {
			try {
				await this.occ.setSite(this.site);
				let folders = await this.fetchFiles();
				let selectedFiles = await infoRequest.quickPickMany(folders, "Seleccione los archivos a eliminar");
				if (!selectedFiles) {
					// this.setError("No se seleccionaron archivos para eliminar");
					this.taskIncomplete("No se seleccionaron archivos para eliminar");
					reject();
					return;
				}

				this.initTask({
					title: "ELIMINANDO ARCHIVO(S)",
					config: {
						Ambiente: this.env.env,
						Sitio: this.site ? this.site : "TODOS",
						Archivos: selectedFiles.join(", ")
					}
				});

				let deleteFilesStatus = await this.deleteFiles(selectedFiles);
				if (deleteFilesStatus.success) {
					this.taskSuccess()
					resolve();
				} else {
					this.taskFailed();
					reject();
				}
			} catch (e) {
				logger.doLog(JSON.stringify(e));
				this.taskFailed();
				reject();
			}
		});
	}

	async putFile() {
		try {
			logger.doLog("Creando archivo...", true);
			let token = await this.occ.put({
				url: this.occ.ENDPOINTS.THIRDPARTY.FILES,
				data: {
					filename: `${this.folder}/${this.fileName}`,
					segments: 1,
					uploadtype: "thirdPartyFile",
				}
			});
			token = token.token;

			logger.doLog("Archivo creado!", false);

			logger.doLog("Agregando contenido al archivo...", true);
			let fileUpload = await this.occ.post({
				url: this.occ.ENDPOINTS.THIRDPARTY.FILES + "/" + token,
				data: {
					filename: `${this.folder}/${this.fileName}`,
					index: 0,
					file: this.base64,
				}
			});
			if (fileUpload.result.uploadResult.fileResults[0].success) logger.doLog("Contenido agregado!", true);
			return {
				response: fileUpload,
				success: fileUpload.result.uploadResult.fileResults[0].success
			};
		} catch (e) {
			logger.doLog("Error subiendo archivo" + e, true);
			return {
				response: e,
				success: false
			};
		}
	}

	async fetchFolders() {
		try {
			let folders = [];
			let response = await this.occ.get({
				url: this.occ.ENDPOINTS.THIRDPARTY.FOLDERS,
				msg:"Buscando carpetas..."
			});

			folders = [CONSTANTS.NUEVA, "/"].concat(response.map(function (folder) {
				return folder.name;
			}));

			return folders;
		} catch (e) {
			return e;
		}
	}

	async createFolder(folderName) {
		try {
			logger.doLog("Creando carpeta...", true);
			let response = await this.occ.post({
				url: this.occ.ENDPOINTS.THIRDPARTY.CREATE_FOLDER,
				data: {
					folder: "/thirdparty/" + folderName
				}
			});
			if (response.success) logger.doLog("Carpeta creada correctamente!", false);
			return {
				response: response,
				success: response.success
			}
		} catch (e) {
			logger.doLog(`Error creando la carpeta ${folderName}: ${e}`)
			return {
				response: e,
				success: false
			}
		}
	}

	async fetchFiles() {
		try {
			let response = await this.occ.get({
				url: this.occ.ENDPOINTS.THIRDPARTY.FILES,
				params: {
					folder: "/thirdparty",
					assetType: "all"
				},
				msg:"Buscando archivos..."
			});
			let files;

			if (this.site) {
				files = response.filter(function (file) {
					return file.repositoryId.indexOf("sitefiles") != -1
				}).map((file) => {
					return file.path;
				});
			} else {
				files = response.map((file) => {
					return file.path;
				});
			}

			return files;

		} catch (e) {
			return null;
		}
	}

	async deleteFiles(files) {
		try {
			logger.doLog("Eliminando archivos...", true);
			let response = await this.occ.post({
				url: this.occ.ENDPOINTS.THIRDPARTY.DELETE_FILES,
				data: {
					"deletePaths": files
				}
			});
			logger.doLog("Archivos eliminados!", true);
			return response;
		} catch (e) {
			logger.doLog("Error eliminando archivos:");
			logger.doLog(`STATUS: ${e.status}`);
			logger.doLog(`MSG: ${e.data.errorCode} -> ${e.data.message}`);

			return {
				response: e,
				success: false
			}
		}
	}

}

module.exports = ThirdParty;