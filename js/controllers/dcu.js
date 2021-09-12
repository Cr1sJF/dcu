// const vscode = require("vscode");
const utils = require("../utils");
const vscode = require("vscode");
const globalVars = require("./globalVars");
const Environment = require("../models/Environment");
const Folder = require("../models/Folder");

const infoRequest = require("../controllers/infoRequest");
const logger = require("../controllers/logger");
const fileTracking = require("../controllers/fileTracking");
const notifier = require("../controllers/notifier");

const CONSTANTS = require("../CONS/CONSTANTS.json");
const TEXTS = require("../CONS/TEXTS.json");
const OCC = require("../models/occ");
const Component = require("../models/Component");

const processUpdate = async (type) => {
	let currentVersion = vscode.extensions.getExtension("CrisJF.dcu-utils").packageJSON.version;
	let message;
	let force = false;
	if (type == CONSTANTS.UPDATE_TYPES.MAJOR) {
		message = "Hemos tenido grandes cambios desde la última vez. Recomendamos que revises la documentación. ¿Quieres ver las mejoras de la versión " + currentVersion + "?";
		force = true;
	} else if (type == CONSTANTS.UPDATE_TYPES.MINOR) {
		message = "Hemos incorporado algunas mejoras. ¿Quieres ver las novedades de la versión " + currentVersion + "?"
	} else if (type == CONSTANTS.UPDATE_TYPES.FIX) {
		message = "Hemos solucionado algunos errores. ¡No te preocupes!";
	} else if (type == CONSTANTS.UPDATE_TYPES.NEW) {
		message = "No hemos detectado que tuvieras instalada esta extensión previamente. Recomendamos que revises la documentación. ¿Quieres ver las mejoras de la versión " + currentVersion + "?";
		force = true;
	}

	let notifyUpdate = utils.getConfig(CONSTANTS.CONFIG.GENERAL.NAME, CONSTANTS.CONFIG.GENERAL.PROPS.NOTIFY_UPDATES);

	if (force || notifyUpdate == CONSTANTS.PREGUNTAR) {
		let res = await infoRequest.askTroughNotification({
			msg: message,
			options: [CONSTANTS.SI, CONSTANTS.NO]
		});

		if (res === CONSTANTS.SI) {
			vscode.env.openExternal(vscode.Uri.parse("https://marketplace.visualstudio.com/items?itemName=CrisJF.dcu-utils#" + currentVersion.replaceAll(".", "")));
		}
	} else if (notifyUpdate == CONSTANTS.SI) {
		notifier.notify({ msg: `Hey! Mirá las novedades de DCU UTILS` });
		setTimeout(() => {
			vscode.env.openExternal(vscode.Uri.parse("https://marketplace.visualstudio.com/items?itemName=CrisJF.dcu-utils#" + currentVersion.replaceAll(".", "")));
		}, 2500);
	}
};

const validateVersion = async (STORAGE) => {
	let currentVersion = vscode.extensions.getExtension("CrisJF.dcu-utils").packageJSON.version;
	let localVersion = STORAGE.get(CONSTANTS.STORAGE.VERSION);
	STORAGE.update(CONSTANTS.STORAGE.VERSION, currentVersion);
	if (!localVersion) {
		processUpdate(CONSTANTS.UPDATE_TYPES.NEW);
		return;
	}

	if (currentVersion == localVersion) return;

	currentVersion = currentVersion.split(".");
	localVersion = localVersion.split(".");

	if (Number(localVersion[0]) < Number(currentVersion[0])) {
		processUpdate(CONSTANTS.UPDATE_TYPES.MAJOR);
	} else if (Number(localVersion[1]) < Number(currentVersion[1])) {
		processUpdate(CONSTANTS.UPDATE_TYPES.MINOR);
	} else if (Number(localVersion[2]) < Number(currentVersion[2])) {
		processUpdate(CONSTANTS.UPDATE_TYPES.FIX);
	}
};

const initFileTracking = () => {
	fileTracking.init();
}

const init = (STORAGE) => {
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: TEXTS.INIT_MSGS.INITIALIZING,
		cancellable: false,

	}, (progress) => {

		const p = new Promise(resolve => {
			utils.initTranslate();

			progress.report({ increment: 10, message: TEXTS.INIT_MSGS.SEARCHING_FOLDERS });
			let occFolders = utils.filterOccFolders();
			let occEnvironments = {};
			let occMinenvironments = {};
			progress.report({ increment: 10, message: TEXTS.INIT_MSGS.FILTERING_FOLDERS });
			for (var i in occFolders) {
				let env = new Environment(occFolders[i], "ENV");
				// let minEnv = new Environment(env, "MIN");
				let folder = new Folder({
					environment: env,
					children: occFolders[i].children,
					path: env.basePath,
				});
				// occMinenvironments[env.env] = minEnv;
				occEnvironments[env.basePath] = folder;
			}

			progress.report({ increment: 10, message: TEXTS.INIT_MSGS.LOADING_ENVIRONMENTS });
			let configEnv = utils.getEnvCredentials();
			for (var i in configEnv) {
				let minEnv = new Environment(configEnv[i], "MIN");
				minEnv.env = i;
				occMinenvironments[i] = minEnv;
			}

			globalVars.setGlobalVar(globalVars.VARS_NAMES.OCC_FOLDERS, occEnvironments);
			globalVars.setGlobalVar(globalVars.VARS_NAMES.OCC_ENV_DATA, occMinenvironments);
			progress.report({ increment: 10, message: TEXTS.INIT_MSGS.VALIDATING_VERSION });

			// STORAGE.update(CONSTANTS.STORAGE.VERSION, "3.0.1");

			validateVersion(STORAGE);
			progress.report({ increment: 10, message: TEXTS.INIT_MSGS.INITIALIZING_FILE_TRACKING });
			initFileTracking();
			resolve();
		});

		return p;
	});
};

const getOccSite = async (env) => {
	try {
		let occ = new OCC({
			node: env.node.origin,
			key: env.key,
		});

		let sites = await occ.fetchSites();
		let selectedSite = await infoRequest.quickPick(
			sites.map((site) => {
				return site.label;
			}),
			TEXTS.CHOOSE_SITE
		);
		if (!selectedSite) return;

		return sites.find(site => {
			return site.label == selectedSite
		}).id;

	} catch (e) {
		logger.postError({
			source: "dcu.uploadThirdPartyFile",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

const getEnvironment = async (externalFile) => {
	try {
		let env = new Environment(externalFile, "FOLDER");
		if (env.errorFlag) {
			logger.logError(env.errorMsg);
			return;
		}

		return env;
	} catch (e) {
		logger.logError(e.message);
		logger.postError({
			source: "dcu.getEnvironment",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

const getEnvironmentInfo = (env) => {
	let result;
	result = globalVars.getGlobalVar(globalVars.VARS_NAMES.OCC_ENV_DATA)[env];
	if (!result) {
		let config = utils.getConfig(CONSTANTS.CONFIG[env]);
		result = new Environment(
			{
				env: env,
				key: config.key,
				node: config.enviromentUrl,
			},
			"MIN"
		);
	}
	return result;
};

const pickEnv = async () => {
	try {
		let occEnv = await infoRequest.pickEnvironment();
		if (!occEnv) return;

		let environment = new Environment(occEnv, "OCC");
		if (!environment.key || !environment.node) {
			logger.logError(TEXTS.ERRORS.NO_ENV_VALID_CONFIG, logger.LOG);
			return;
		}
		return environment;
	} catch (e) {
		logger.logError(e.message);
		logger.postError({
			source: "dcu.pickEnv",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

const getComponent = async (externalFile) => {
	try {
		let component = new Component();
		await component.init(externalFile);
		if (component.errorFlag) {
			logger.logError(component.errorMsg);
			return;
		}
		return component;
	} catch (e) {
		logger.logError(e.message);
		logger.postError({
			source: "dcu.getComponent",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

const getComponentFromFolder = async (folder) => {
	try {
		let component = new Component(folder);
		await component.init();
		if (component.errorFlag) {
			logger.logError(component.errorMsg);
			return;
		}
		return component;
	} catch (e) {
		logger.logError(e.message);
		logger.postError({
			source: "dcu.getComponentFromFolder",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

const getComponentPath = async (folder) => {
	try {
		let componentName = await infoRequest.fillComponent();

		if (!componentName) return;

		let componentPath = utils.findComponentInNode(folder.children, componentName);
		if (!componentPath) {
			logger.logError(TEXTS.ERRORS.MISSING_COMPONENT);
			return;
		}
		return componentPath;
	} catch (e) {
		logger.logError(e.message);
		logger.postError({
			source: "dcu.getComponentPath",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

const getOrigin = async () => {
	try {
		let envName = await infoRequest.pickEnvironment(TEXTS.CHOOSE_ORIGIN);
		if (!envName) return;
		let origin = getEnvironmentInfo(envName);
		if (origin.errorFlag) {
			logger.logError(origin.errorMsg);
			return;
		}
		return origin;
	} catch (e) {
		logger.logError(e.message);
		logger.postError({
			source: "dcu.getOrigin",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

const getDestination = async (exclude) => {
	try {
		let envName = await infoRequest.pickEnvironment(TEXTS.CHOOSE_DESTINATION, exclude);
		if (!envName) return;
		let dest = getEnvironmentInfo(envName);

		if (dest.errorFlag) {
			logger.logError(dest.errorMsg);
			return;
		}

		return dest;
	} catch (e) {
		logger.logError(e.message);
		logger.postError({
			source: "dcu.getDestination",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

let validations = {};
validations[CONSTANTS.CONFIG.DCU.PROPS.UPDATE_ALL_INSTANCES] = async (instanciable) => {
	try {
		let result;
		let config = utils.getConfig(CONSTANTS.CONFIG.DCU.NAME, CONSTANTS.CONFIG.DCU.PROPS.UPDATE_ALL_INSTANCES);
		if (!instanciable || config == CONSTANTS.NO) result = false;
		else if (config == CONSTANTS.PREGUNTAR && instanciable) {
			result = await infoRequest.askTroughNotification({
				msg: CONSTANTS.CONFIG.QUESTIONS[CONSTANTS.CONFIG.DCU.PROPS.UPDATE_ALL_INSTANCES],
				options: [CONSTANTS.SI, CONSTANTS.NO],
				type: CONSTANTS.MGS_TYPES.WARN,
			});
			if (!result) return;
			result = result == CONSTANTS.SI;
		} else if (config == CONSTANTS.SI) {
			result = instanciable;
		}
		return result;
	} catch (e) {
		return;
	}
};
const configMaps = {
	SIEMPRE: CONSTANTS.SI,
	NUNCA: CONSTANTS.NO,
	"SOLO SI ES ARCHIVO BASE": (value) => {
		return value ? CONSTANTS.SI : CONSTANTS.NO;
	},
};

const evaluateConfig = async (group, config, validatable) => {
	try {
		let result;
		let value = utils.getConfig(group, config);

		if (typeof value === "boolean") return value;

		if (validations[config]) {
			return validations[config](validatable);
		}

		if (value == CONSTANTS.PREGUNTAR) {
			result = await infoRequest.quickPick([CONSTANTS.SI, CONSTANTS.NO], CONSTANTS.CONFIG.QUESTIONS[config]);
			if (!result) return;
		}

		if (configMaps[value]) {
			if (typeof configMaps[value] === "function") {
				result = configMaps[value](validatable);
			}
		}

		result = result ? result : value;

		return result == CONSTANTS.SI ? true : false;
	} catch (e) {
		logger.logError(e.message);
		logger.postError({
			source: "dcu.evaluateConfig",
			error: e.message,
			stack: e.stack,
		});
		return;
	}
};

module.exports = {
	init,
	validateVersion,
	evaluateConfig,
	//API
	getOccSite,
	//ENV
	pickEnv,
	getEnvironment,
	getEnvironmentInfo,
	getOrigin,
	getDestination,
	//COMP
	getComponent,
	getComponentFromFolder,
	getComponentPath,
};
