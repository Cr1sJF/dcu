const infoRequest = require("../controllers/infoRequest");
const globalVars = require("../controllers/globalVars");
const utils = require("../utils");

class Environment {
	constructor(data, dataType) {
		try {
			this.errorFlag = false;
			this.errorMsg = "";

			if (dataType == "ENV") {
				this.basePath = data.basePath;
				this.env = data.env;
				this.occVersion = data.occVersion;
				this.dcuVersion = data.dcuVersion;
				this.key = data.key;
				this.node = data.node;
				this.lang = data.lang;
			} else if (dataType == "FOLDER") {
				data = data || infoRequest.getOpenEditor();
				if (!data) {
					this.setError("No data");
					return;
				}

				let folders = globalVars.getGlobalVar(globalVars.VARS_NAMES.OCC_FOLDERS);
				let path = this.cleanPath(data);
				for (var i in folders) {
					if (path.toUpperCase().indexOf(i.toUpperCase()) != -1) {
						let env = folders[i].environment;
						this.basePath = env.basePath;
						this.env = env.env;
						this.occVersion = env.occVersion;
						this.dcuVersion = env.dcuVersion;
						this.key = env.key;
						this.node = env.node;
						this.lang = env.lang;
						break;
					}
				}
			} else if (dataType == "OCC") {

				let minEnvs = globalVars.getGlobalVar(globalVars.VARS_NAMES.OCC_ENV_DATA);
				for (var i in minEnvs) {
					if (i == data) {
						let env = minEnvs[i];
						this.env = env.env;
						this.key = env.key;
						this.node = env.node;
						break;
					}
				}
			} else if (dataType == "MIN") {
				this.env = data.env;
				this.occVersion = data.occVersion;
				this.dcuVersion = data.dcuVersion;
				this.lang = data.lang;
				this.key = data.key;
				this.node = data.node;
			} else {
				this.setError("Bad dataType");
			}

			if (!this.key || !this.node) {
				this.setError(`Missing node URL or key for ${this.env} environment`);
			}

		} catch (e) {
			this.setError(e.message);
		}
	}

	cleanPath(path) {
		if (!path) {
			this.setError("Missing path");
			return "";
		}
		try {
			return utils.cleanPath(path);
		} catch (e) {
			this.setError(e.message);
		}

	}

	validate(prop) {
		if (!prop) {
			this.setError(`Property value not found => "${Object.keys(prop)[0]}"`);
		}
	}

	setError(msg) {
		if (!this.errorFlag) {
			this.errorFlag = true;
			this.errorMsg = msg;
		}
	}
	// setup() {
	//     this.configPath = this.basePath + "/.ccc/config.json";
	//     Object.assign(this, globalVars.getGlobalVar(globalVars.VARS_NAMES.OCC_FOLDERS)[this.basePath]);
	// }
}

module.exports = Environment;