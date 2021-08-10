const vscode = require("vscode");
const CONST = require("../CONS/CONSTANTS.json");
const TEXTS = require("../CONS/TEXTS.json");
const boxen = require("boxen");
const output = vscode.window.createOutputChannel("DCU INFO");
output.show();

const notifier = require("./notifier");

const axios = require("axios").default;
const CONFIG = require("../config.json");

const drawLine = (data) => {
	let totalLength = 60;
	if (typeof data === "number") {
		output.appendLine("_".repeat(data ? data + totalLength + 2 : totalLength));
		return;
	}

	output.appendLine(
		boxen(data, {
			padding: {
				top: 0,
				bottom: 0,
				left: 10,
				right: 10,
			},
			borderStyle: "classic",
		})
	);

	output.appendLine("");
};

const logTitle = (title) => {
	output.appendLine(title.toUpperCase());
	output.appendLine("‾".repeat(title.length));
	// output.appendLine("");
};

const logResult = (text) => {
	output.appendLine(
		boxen(`${TEXTS.STATUS}: ${text.toUpperCase()}`, {
			padding: {
				top: 0,
				bottom: 0,
				left: 10,
				right: 10,
			},
			borderStyle: "double",
		})
	);
};

const doLog = (text, skipApend) => {
	output.appendLine(text);
	if (skipApend) return;
	output.appendLine("");
};

const logTypes = {
	SECTION: drawLine,
	END_SECTION: drawLine,
	TITLE: logTitle,
	RESULT: logResult,
	LOG: doLog,
};

const log = ({ text, type }) => {
	logTypes[type || CONST.MGS_TYPES.LOG](text);
};

const logError = (text, type, force) => {
	log({ text, type });
	// drawLine(TEXTS.ERROR.length);
	if (force) {
		notifier.notify({
			msg: text,
		}, CONST.MGS_TYPES.ERROR);
		return;
	}
	notifier.notifyError(text);
};

const logWarn = (text, type) => {
	log({ text, type });
	notifier.notifyWarning(text);
};

const logInfo = (text, type) => {
	log({ text, type });
	notifier.notifyInfo(text);
};

const logResultAndWarn = (text, warnMsg) => {
	log({ text, type: "RESULT" });
	// drawLine(TEXTS.SUCCESS.length);
	if (warnMsg) {
		notifier.notify(warnMsg, CONST.MGS_TYPES.WARN);
		return;
	}
	notifier.notifySuccess(text);
};


const postError = (payload) => {
	if (!payload) return;
	axios.post(CONFIG.ENDPOINTS.LOG.BASE_URL + CONFIG.ENDPOINTS.LOG.ERROR, payload);
};

const sendFeedback = async (feedback, type) => {
	try {
		let resp = await axios.post(CONFIG.ENDPOINTS.LOG.BASE_URL + CONFIG.ENDPOINTS.LOG.FEEDBACK[type], feedback, {
			headers: {
				"Content-Type": "text/plain",
			},
		});
		if (resp.status == 200) {
			logAndForceNotification("Feedback enviado correctamente!", CONST.MGS_TYPES.SUCCESS);
		} else {
			logError("Error enviando Feedback", CONST.MGS_TYPES.ERROR, true);
		}
	} catch (e) {
		logError("Error enviando Feedback", CONST.MGS_TYPES.ERROR, true);
	}
};

const logAndForceNotification = (text, type) => {
	log({ text, type });
	notifier.notify(text, CONST.MGS_TYPES.INFO);
}

/**
 * Deja un mensaje en el LOG y muestra una notificacion efimera
 * @param {Object} data Configuracion del log
 * @param {String} data.msg Mensaje a loggear
 * @param {Promise} data.promise Promesa que se debe cumplir para desaparecer el mensaje
 * @param {String} [data.type] Tipo de log
 */
const logAndTempNotification = (data) => {
	doLog(data.msg, true);
	notifier.tempMsg({
		msg: data.msg,
		promise: data.promise
	});
}

module.exports = {
	log,
	doLog,
	logError,
	logWarn,
	logInfo,
	logResultAndWarn: logResultAndWarn,
	postError,
	sendFeedback,
	logAndForceNotification,
	logAndTempNotification,
	SECTION: "SECTION",
	END_SECTION: "END_SECTION",
	TITLE: "TITLE",
	RESULT: "RESULT",
	LOG: "LOG",
};
