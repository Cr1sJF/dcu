const vscode = require("vscode");
const dirTree = require("directory-tree");
const fs = require("fs");
const { URL } = require("url");
const CONST = require("./CONS/CONSTANTS.json");
const nls = require("vscode-nls");
const copyPaste = require("copy-paste");
// const notifier = require("./controllers/notifier");

// const localize = nls.config({ messageFormat: nls.MessageFormat.file })();
const localize = nls.config({
	messageFormat: nls.MessageFormat.file
});
// localize = nls.loadMessageBundle()
const initTranslate = () => {

}

const extendObj = (origin, add) => {
	if (!add || (typeof add !== "object" && add !== null)) {
		return origin;
	}

	var keys = Object.keys(add);
	var i = keys.length;
	while (i--) {
		origin[keys[i]] = add[keys[i]];
	}
	return origin;
};

const compare = (a, b) => {
	if (a === b) {
		return 0;
	}

	var a_components = a.split(".");
	var b_components = b.split(".");

	var len = Math.min(a_components.length, b_components.length);

	// loop while the components are equal
	for (var i = 0; i < len; i++) {
		// A bigger than B
		if (parseInt(a_components[i]) > parseInt(b_components[i])) {
			return 1;
		}

		// B bigger than A
		if (parseInt(a_components[i]) < parseInt(b_components[i])) {
			return -1;
		}
	}

	// If one's a prefix of the other, the longer one is greater.
	if (a_components.length > b_components.length) {
		return 1;
	}

	if (a_components.length < b_components.length) {
		return -1;
	}

	// Otherwise they are the same.
	return 0;
};

const getEnvCredentials = () => {
	try {
		let result = {};
		CONST.CONFIG.ENVS.forEach(function (env) {
			result[env] = {
				node: getConfig(CONST.CONFIG[env], CONST.CONFIG.PROPS.ENVIROMENT_URL),
				key: getConfig(CONST.CONFIG[env], CONST.CONFIG.PROPS.APP_KEY),
			}
		});

		return result;
	} catch (e) {

	}
}

const getConfig = (key, subKey) => {
	// vscode.workspace.getConfiguration()
	if (!subKey) {
		return vscode.workspace.getConfiguration(key);
	} else if (vscode.workspace.getConfiguration(key)) {
		return vscode.workspace.getConfiguration(key).get(subKey);
	} else {
		return null;
	}
};

const replace = (source, replaceWith) => {
	if (replaceWith && typeof replaceWith === "object") {
		var response = new String(source);
		Object.keys(replaceWith).forEach(function (value) {
			response = response.replace(new RegExp("@@" + value + "@@", "g"), replaceWith[value]);
		});
		return response;
	} else {
		return source;
	}
};

const getSiteConfig = (path) => {
	let result = {};

	try {
		let rawData = fs.readFileSync(path + "/.ccc/config.json");
		let envConfig = JSON.parse(rawData.toString());
		result.node = new URL(envConfig.node);
		result.occVersion = envConfig.commerceCloudVersion;
		result.dcuVersion = envConfig.packageVersion;
		result.basePath = path;
		result.lang = envConfig.grabLocale;
		result.children = dirTree(path, {
			normalizePath: true,
			exclude: /.ccc/,
		});
		let settings = getConfig("dcu"); // TODO move as const

		for (let i = 2; i <= 5; i++) {
			if (JSON.stringify(settings[i]).indexOf(result.node.origin) != -1) {
				result.settings = CONST.CONFIG[Object.keys(settings[i])[0].toUpperCase()];
				result.env = Object.keys(settings[i])[0].toUpperCase();
				result.key = settings[i][result.env.toLowerCase()][CONST.CONFIG.PROPS.APP_KEY];
				break;
			}
		}
	} catch (error) {
		return;
	}



	return result;
};

const findComponentInNode = (node, component) => {
	var result;
	(function check(node) {
		if (node.name.toUpperCase() == component.toUpperCase()) {
			result = node;
			return;
		}

		if (node.children) {
			for (var i = 0; i < node.children.length; i++) {
				check(node.children[i]);
			}
		} else return;
	})(node);

	return result;
};

const searchInFolders = (node, query) => {
	var results = [];
	(function check(node) {
		if (node.name.toUpperCase() == query.toUpperCase()) {
			results.push(node);
		}

		if (node.children) {
			for (var i = 0; i < node.children.length; i++) {
				check(node.children[i]);
			}
		} else return;
	})(node);

	return results;
};

const filterOccFolders = () => {
	try {
		let trees = [];
		let folders = [];
		let environments = {};
		if (vscode.workspace.workspaceFolders) {
			vscode.workspace.workspaceFolders.forEach((folder) => {
				trees.push(
					dirTree(folder.uri.path.substring(1), {
						normalizePath: true,
						exclude: [/widget/, /element/, /global/, /siteSettings/, /snippets/, /stack/, /static/, /theme/],
					})
				);
			});
			// trees = trees.concat
			trees.forEach(function (tree) {
				folders = folders.concat(searchInFolders(tree, ".ccc"));
			});

			folders.forEach((folder) => {
				let path = folder.path;
				let basePath = path.substring(0, folder.path.lastIndexOf("/"));
				environments[basePath] = getSiteConfig(basePath);
			});

			return environments;
		}
		return null;
	} catch (e) {
		console.error(e);
		return null;
	}
};

const cleanPath = (path) => {
	if (typeof path === "object") {
		path = path.path || path.uri.path || path.fsPath;
	}
	path = path.replace(/\\/g, "/");
	if (path.startsWith("/")) {
		return path.substring(1);
	}
	return path;
};

const removeFiles = (path, exclusions) => {
	let dir = dirTree(path, {
		normalizePath: true,
	});
	dir.children.forEach(function (folder) {
		if (folder.type == "file") {
			let name = folder.name.substring(0, folder.name.indexOf(folder.extension));
			if (!exclusions.includes(name)) {
				fs.rmSync(folder.path);
			}
		} else {
			if (!exclusions.includes(folder.name)) {
				fs.rmdirSync(folder.path, { recursive: true });
			}
		}
	});
};

const convertToBase64 = (filePath) => {
	try {
		let data = fs.readFileSync(cleanPath(filePath));
		return data.toString("base64");
	} catch (e) {
		return;
	}
};

const writeFile = async (path, data) => {
	try {
		path = cleanPath(path);
		if (typeof data != "string") {
			data = JSON.stringify(data);
		}
		fs.writeFileSync(path, data);
	} catch (e) {
		console.log(e);
	}
}

const closeFile = async () => {
	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
}

const readDir = (path) => {
	try {
		path = cleanPath(path);
		return dirTree(path, {
			normalizePath: true
		})
	} catch (e) {

	}
}

const readFile = (path) => {
	try {
		path = cleanPath(path);
		let file = fs.readFileSync(path);
		return file.toString();
	} catch (e) {
		return;
	}
}

const renameFile = (path, newName) => {
	try {
		fs.renameSync(cleanPath(path), newName);
		return;
	} catch (e) {
		return;
	}
}

const getOpenEditor = () => {
	// let result = vscode.window.visibleTextEditors.find((editor) => {
	// 	return editor.document.languageId != CONST.EDITORS.LOG;
	// });

	let result = vscode.window.activeTextEditor;

	if (result.document.languageId == CONST.EDITORS.LOG) {
		return;
	}

	return result;
}

const formatAll = async (uri) => {

	uri = vscode.Uri.file(uri.path || uri);
	const stat = await vscode.workspace.fs.stat(uri);
	if (stat.type === vscode.FileType.Directory) {
		const files = await vscode.workspace.fs.readDirectory(uri);
		for (const file of files) {
			await formatAll(vscode.Uri.joinPath(uri, file[0]));
		}
	} else if (stat.type === vscode.FileType.File) {
		try {
			await vscode.window.showTextDocument(uri);
			await vscode.commands.executeCommand('editor.action.formatDocument');
			// await vscode.commands.executeCommand('workbench.action.files.save');
		} catch (e) {
			console.error(uri.fsPath);
		}
	}
	await vscode.commands.executeCommand("workbench.action.files.saveAll");
}

const formatFile = async (uri) => {
	uri = vscode.Uri.file(uri);
	const stat = await vscode.workspace.fs.stat(uri);
	if (stat.type === vscode.FileType.File) {
		try {
			await vscode.window.showTextDocument(uri);
			await vscode.commands.executeCommand('editor.action.formatDocument');
		} catch (e) {
			console.error(uri.fsPath);
		}
	}
	await vscode.commands.executeCommand("workbench.action.files.saveAll");
};

const translate = (key) => {
	localize(key);
}

const copyToClipboard = (content) => {
	copyPaste.copy(content);
}

module.exports = {
	translate,
	compare,
	extendObj,
	getConfig,
	filterOccFolders,
	searchInFolders,
	findComponentInNode,
	replace,
	cleanPath,
	removeFiles,
	convertToBase64,
	getEnvCredentials,
	writeFile,
	readDir,
	getOpenEditor,
	readFile,
	formatAll,
	formatFile,
	initTranslate,
	renameFile,
	closeFile,
	copyToClipboard
};
