const vscode = require("vscode");
const utils = require("../utils");
const CONST = require("../CONS/CONSTANTS.json");

/**
 * Tipo de notificaciones
 * @enum {*}
 */
const notificationTypes = {
	ERROR: vscode.window.showErrorMessage,
	// INFO: vscode.window.showInformationMessage,
	INFO: (msg, options) => {
		if (options) {
			return vscode.window.showInformationMessage(msg, ...options);
		} else {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: msg,
				cancellable: false,
			}, (progress) => {
				const p = new Promise(resolve => {
					utils.initTranslate();

					progress.report({ increment: 1 });

					let timeleft = 100;
					let downloadTimer = setInterval(() => {
						if (timeleft <= 0) {
							clearInterval(downloadTimer);
							resolve();
						}
						timeleft -= 1;
						progress.report({ increment: 1 });
					}, 25);
				});

				return p;
			});
		}
	},
	WARN: vscode.window.showWarningMessage,
	SUCCESS: vscode.window.showInformationMessage
}
/**
 * 
 * @param {Object} data Configuración del mensaje
 * @param {String} data.msg Mensaje de la notificación
 * @param {Array} [data.options] Opciones de la notificación
 * @param {String} data Mensaje de la notificacion
 * @param {notificationTypes} type Tipo de notificación
 * 
 * @returns {Promise<String>} Respuesta, cuando la notificación tiene opciones
 * 
 * @enum {*}
 */
const notify = async (data, type) => {
	if (typeof data == "string") {
		data = {
			msg: data
		};
	}

	if (data.options) {
		let response;
		if(type && type != CONST.MGS_TYPES.INFO){
			response = await notificationTypes[type || CONST.MGS_TYPES.INFO](data.msg, ...data.options);
		}else{
			response = await notificationTypes[type || CONST.MGS_TYPES.INFO](data.msg, data.options);
		}
		return response;
	}
	notificationTypes[type || CONST.MGS_TYPES.INFO](data.msg);
}

const shouldNotify = msgType => {
	let showNotif = utils.getConfig(CONST.CONFIG.GENERAL.NAME, CONST.CONFIG.GENERAL.PROPS.SHOW_NOTIFICATIONS);
	return (showNotif == CONST.SI) || (showNotif == CONST.SOLO_ERRORES && msgType == CONST.MGS_TYPES.ERROR);
}

const notifyError = options => {
	if (shouldNotify(CONST.MGS_TYPES.ERROR)) {
		if (typeof options === "string") {
			options = {
				msg: options
			}
		}
		notify(options, CONST.MGS_TYPES.ERROR);
	}
}

const notifyWarning = options => {
	if (shouldNotify(CONST.MGS_TYPES.WARN)) {
		if (typeof options === "string") {
			options = {
				msg: options
			}
		}
		notify(options, CONST.MGS_TYPES.WARN);
	}
}

const notifyInfo = options => {
	if (shouldNotify(CONST.MGS_TYPES.INFO)) {
		if (typeof options === "string") {
			options = {
				msg: options
			}
		}
		notify(options, CONST.MGS_TYPES.INFO);
	}
}


const notifySuccess = options => {
	if (shouldNotify(CONST.MGS_TYPES.INFO)) {
		notify(options, CONST.MGS_TYPES.INFO);
	}
}

/**
 * Muestra una notificación temporal hasta que un suceso finalice
 * @param {Object} options Configuracion del mensaje temporal
 * @param {String} options.msg Mensaje de la notificacion
 * @param {Promise} options.promise Promesa que destruye la notificacion
 */
const tempMsg = options => {
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: options.msg,
		cancellable: true,

	}, (progress) => {
		const p = new Promise(async resolve => {
			progress.report({ increment: 1 });
			// let timeleft = 100;
			let downloadTimer = setInterval(() => {
				// if (timeleft <= 0) {
				// 	clearInterval(downloadTimer);
				// 	resolve();
				// }
				// timeleft -= 1;
				progress.report({ increment: 1 });
			}, 10);

			options.promise.then(() => {
				clearInterval(downloadTimer);
				resolve();
			}).catch(() => {
				clearInterval(downloadTimer);
				resolve();
			});
		});

		return p;

	});
}
module.exports = {
	notifyError,
	notifyWarning,
	notifyInfo,
	notifySuccess,
	notify,
	tempMsg
};