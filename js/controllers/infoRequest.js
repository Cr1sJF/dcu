const utils = require("../utils");
const vscode = require("vscode");
const CONSTANTS = require("../CONS/CONSTANTS.json");
const TEXTS = require("../CONS/TEXTS.json");
const globalVars = require("./globalVars");
const notifier = require("./notifier");

const pickFolder = async (title) => {
	let resp = await vscode.window.showOpenDialog({
		canSelectFolders: true,
		canSelectFiles: false,
		canSelectMany: false,
		title: title,
	});

	return resp;
};

const pickFile = async (title, filters) => {
	let resp = await vscode.window.showOpenDialog({
		canSelectFolders: false,
		canSelectFiles: true,
		canSelectMany: false,
		title: title,
		filters: filters
	});

	return resp[0];
};

const quickPick = async (items, title, placeHolder) => {
	let response;
	if (typeof items == "string") {
		items = items.split(",");
	}
	response = await vscode.window.showQuickPick(items, {
		ignoreFocusOut: true,
		placeHolder,
		title,
	});
	return response;
};

const boolQuickPick = async (title, placeHolder) => {
	let response = await quickPick([CONSTANTS.SI, CONSTANTS.NO], title, placeHolder);
	if (!response) return;

	return response == CONSTANTS.SI ? true : false;
};

const quickPickMany = async (items, title, placeHolder) => {
	let response;
	if (typeof items == "string") {
		items = items.split(",");
	}
	response = await vscode.window.showQuickPick(items, {
		ignoreFocusOut: true,
		placeHolder,
		title,
		canPickMany: true,
	});
	return response;
};

const showInputBox = async (title, placeHolder) => {
	let response = await vscode.window.showInputBox({
		ignoreFocusOut: true,
		placeHolder: placeHolder,
		prompt: title,
	});
	return response;
};

const pickEnvironment = async (title, exclude) => {
	let envs = [...CONSTANTS.ENV.ALL];
	if (exclude) envs.splice(envs.indexOf(exclude), 1);
	let response = await quickPick(envs, title, TEXTS.PICK_ENV);

	if (response == CONSTANTS.ENV.PROD) {
		let cont = await askTroughNotification({
			msg: TEXTS.CONFIRM_PROD_ACTION,
			options: [CONSTANTS.SI, CONSTANTS.NO],
			type: CONSTANTS.MGS_TYPES.WARN,
		});

		if (cont == CONSTANTS.NO) return;
	}

	return response;
};

const pickEnvironmentFolder = async () => {
	let folders = globalVars.getGlobalVar(globalVars.VARS_NAMES.OCC_FOLDERS);
	let options = Object.keys(folders);

	if (options.length == 1) {
		return folders[options[0]];
	}
	let response = await quickPick(options, TEXTS.PICK_OCC_FOLDER); 
	return folders[response];
};

const fillComponent = async () => {
	let response = await showInputBox(TEXTS.LOAD_COMPONENT, TEXTS.LOAD_COMPONENT_PLACEHOLDER);
	return response;
};

const getOpenEditor = () => {
	let editor = utils.getOpenEditor();
	if (editor) editor.document.save();

	return editor ? editor.document : null;
};

const askTroughNotification = async (data) => {
	let response = await notifier.notify(
		{
			msg: data.msg,
			options: typeof data.options === "string" ? data.options.split(".") : data.options,
		},
		data.type || CONSTANTS.MGS_TYPES.INFO
	);

	return response;
};

const getFileContent = (file) => {
	let result;
	if (!file) {
		result = getOpenEditor();
		return result.getText();
	} else {
		let path = utils.cleanPath(file.path);
		let reader = utils.readFile(path);
		return reader.toString();
	}
}

module.exports = {
	pickFolder,
	pickFile,
	pickEnvironment,
	quickPick,
	quickPickMany,
	getOpenEditor,
	pickEnvironmentFolder,
	fillComponent,
	showInputBox,
	askTroughNotification,
	boolQuickPick,
	getFileContent
};
