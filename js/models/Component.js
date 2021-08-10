const CONST = require("../CONS/CONSTANTS.json");
const infoRequest = require("../controllers/infoRequest");

const CONSTANTS = {
	SOURCE_INPUT: "INPUT",
	SOURCE_EXTERNAL: "EXTERNAL",
	SOURCE_EDITOR: "EDITOR",
};

class Component {
	constructor(folder) {
		this.isBaseFile = false;
		this.isConfigurable = false;
		this.instanciable = null;
		this.nestable = false;

		this.isFile = false;
		this.fileName = null;
		this.fileExtension = null;
		this.filePath = null;

		this.componentPath = null;
		this.componentType = null;
		this.componentName = null;
		this.componentAbsolutePath = null;

		this.relativePath = null;
		this.errorFlag = false;
		this.errorMsg = null;
		this.folder = folder;
		this.source = folder ? "FOLDER" : null;
		// if(!folder){
		//     this.init(externalFile);
		// }
	}

	async init(externalFile) {
		if (externalFile) {
			this.source = CONSTANTS.SOURCE_EXTERNAL;
		} else {
			this.source = this.source ? this.source : CONSTANTS.SOURCE_EDITOR;
		}
		await this.getComponent(externalFile);
	}

	async getComponent(externalFile) {
		await this.getFileData(externalFile || infoRequest.getOpenEditor());
	}

	async askForComponent() {
		// if (!this.folder) {
		// 	this.setError("Si no hay editores abiertos, debe pre-seleccionarse un ambiente");
		// 	return;
		// }
		let componentName = await infoRequest.fillComponent();
		let componentPath = this.folder.findComponent(componentName);
		this.getFileData(componentPath);
	}

	async getFileData(file) {
		if (!file) {
			await this.askForComponent();
		} else {
			let path = file.path || file.uri.path;
			path = path.startsWith("/") ? path.substring(1) : path;
			this.path = path;

			let regex = /(?:\.([^.]+))?$/;

			if (regex.exec(path)) {
				this.isFile = true;
				this.fileName = path.substring(path.lastIndexOf("/") + 1);
				this.fileExtension = path.substring(path.lastIndexOf(".") + 1);
				this.isBaseFile = path.indexOf("instances") == -1 && path.indexOf("element") == -1 ? true : false;
			}
			this.populateComponentInfo();
		}

		// this.isFolder = file.scheme && file.scheme == "folder"; //TODO move as constant
	}

	populateComponentInfo() {
		this.getComponentType();
		this.getComponentName();
		this.getComponentPath();
		this.getRelativePath();
		this.getComponentAbsolutePath();
		this.determinateInstanciable();
	}

	validatePath(path) {
		return CONST.VALID_PATHS.some((validPath) => {
			return path.indexOf(validPath) != -1;
		});
	}

	getComponentType() {
		if (this.componentType) return this.componentType;

		let componentType = CONST.VALID_PATHS.find((validPath) => {
			return this.path.indexOf(validPath) != -1;
		});

		this.componentType = componentType;
		this.isConfigurable = CONST.CONFIGURABLE_TYPES.includes(componentType);
		return componentType;
	}

	getComponentName() {
		if (this.componentName) return this.componentName;

		let compType = this.getComponentType();
		let componentName;
		let pathArray = this.path.split("/");

		if (compType === CONST.COMPONENTS.SITE_SETTINGS) {
			this.setError("Proccess on SITE_SETTINGS are not implemented yet"); //TODO move as TEXT
		}
		if (compType === CONST.COMPONENTS.WIDGET || compType === CONST.COMPONENTS.ELEM || compType === CONST.COMPONENTS.THEME) {
			componentName = pathArray[pathArray.indexOf(compType) + 1] ? pathArray[pathArray.indexOf(compType) + 1] : pathArray[pathArray.indexOf(compType)];
		} else {
			componentName = pathArray[pathArray.indexOf(compType)];
		}

		this.componentName = componentName;
		return componentName;
	}

	getComponentPath() {
		if (this.componentPath) return this.componentPath;
		try {
			let componentName = this.getComponentName();
			let pathArray = this.path.split("/");
			let componentPath = pathArray.slice(this.nestable ? pathArray.indexOf(componentName) - 1 : pathArray.indexOf(componentName)).join("/");

			this.componentPath = componentPath;
			return componentPath;
		} catch (e) {
			this.setError("Error getting componentPath => " + e.message); //TODO move as TEXT
		}
	}

	getRelativePath() {
		if (this.relativePath) return this.relativePath;
		try {
			let relativePath;
			if (
				this.componentName.toUpperCase() == CONST.COMPONENTS.GLOBAL.toUpperCase() ||
				// || this.componentName.toUpperCase() == CONST.COMPONENTS.THEME.toUpperCase()
				this.componentName.toUpperCase() == CONST.COMPONENTS.SNIPPET.toUpperCase()
			) {
				relativePath = this.componentType;
			} else {
				if (this.componentType == this.componentName) {
					relativePath = `${this.componentName}`;
				} else {
					relativePath = `${this.componentType}/${this.componentName}`;
				}
			}
			this.relativePath = relativePath;
			return relativePath;
		} catch (e) {
			this.setError("Invalid component"); //TODO MOVE AS CONSTANT
		}
	}

	getComponentAbsolutePath() {
		this.componentAbsolutePath = this.path.split("/").slice(0, this.path.split("/").indexOf(this.componentName) + 1).join("/");
	}

	determinateInstanciable() {
		if (this.isFile) {
			let instanciable = CONST.INSTANCABLES_FILES.some((file) => {
				return this.fileName.startsWith(file) || this.fileName.endsWith(file);
				// return this.fileName.indexOf(file) != -1;
			});
			this.instanciable = instanciable && this.isBaseFile && (this.componentType != "element" && this.componentType != "theme"); // TODO MOVE AS CONSTANT
			this.nestable = !CONST.UNNESTEABLE_COMPONENTS.includes(this.componentType);
		}
	}

	setError(msg) {
		if (!this.errorFlag) {
			this.errorFlag = true;
			this.errorMsg = msg;
		}
	}
}

module.exports = Component;
