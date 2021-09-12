const axios = require("axios").default;
const ENDPOINTS = require("../CONS/ENDPOINTS.json");
const logger = require("../controllers/logger");
const stringifyPrimitive = function (primitive) {
	"use strict";
	if (primitive) {
		var primitiveType = typeof primitive;
		//console.log ('The primitive type is ::' + primitiveType);
		var primitiveStringValue = null;
		switch (primitiveType) {
			case "boolean":
				primitiveStringValue = primitive ? true : false;
				break;
			case "number":
				primitiveStringValue = isFinite(primitive) ? primitive : "";
				break;
			case "string":
				primitiveStringValue = primitive;
				break;
			default:
				primitiveStringValue = "";
		}
		//console.log ('The primitive stringified value is ::' + primitiveStringValue);
		return primitiveStringValue;
	}
};

const stringifyQueryString = function (object) {
	"use strict";
	var separatorSymbol = "&";
	var equalSymbol = "=";

	if (object) {
		return Object.keys(object)
			.sort()
			.map(function (key) {
				//if the key is simple primitive, then encode it. Otherwise if this is an
				//array, then do the samething for arrays.
				var keyComponentAsString = encodeURIComponent(stringifyPrimitive(key)) + equalSymbol;
				var keyValue = object[key];

				if (Array.isArray(keyValue)) {
					return keyValue
						.map(function (subValue) {
							var arrayValue = keyComponentAsString + encodeURIComponent(stringifyPrimitive(subValue));
							//console.log ('The key value pair is :' + arrayValue);
							return arrayValue;
						})
						.join(separatorSymbol);
				} else {
					//return key=value
					var returnValue = keyComponentAsString + encodeURIComponent(stringifyPrimitive(keyValue));
					//console.log ('The key value pair is :' + returnValue);
					return returnValue;
				}
			})
			.join(separatorSymbol);
	} else {
		return "";
	}
};

const contentTypes = {
	JSON: "application/json",
	ENCODED: "application/x-www-form-urlencoded",
	FORM: "application/x-www-form-urlencoded",
	MULTIPART: "multipart/form-data",
};

const contentClassMap = {
	"FormData": "MULTIPART"
}

const processResponse = (response) => {
	try {
		if (response.status == 200) {
			return {
				success: true,
				data: response.data.items || response.data || response
			};
		} else if (response.status == 204) {
			return {
				success: true,
				data: {
					success: true
				}
			}
		} else if (!response.data) {
			return {
				success: false,
				data: null
			}
		} else {
			return {
				success: false,
				data: response.statusText
			}
		}
	} catch (e) {
		return {
			success: false,
			data: e
		}
	}
}

const determineContentType = (data) => {
	if (data.data) {
		if (contentClassMap[data.data.constructor.name]) {
			return contentTypes[contentClassMap[data.data.constructor.name]];
		}
		return contentTypes.JSON;
	} else if (data.query) {
		return contentTypes.FORM;
	}
	return contentTypes.JSON;
};

const buildPayload = (data) => {
	let result = {};
	result.url = data.url;
	// if (data.params) {
	// 	result.url += stringifyQueryString(data.params);
	// }
	result.config = data.config || {
		headers: {}
	};
	if (data.headers) {
		result.config.headers = data.headers;
	}
	if (data.pathParam) {
		for (let i in data.pathParam) {
			result.url = result.url.replace(`:${i}`, data.pathParam[i]);
		}
	}
	result.config.headers["Content-Type"] = determineContentType(data);

	result.data = data.query ? stringifyQueryString(data.query) : data.data;

	return result;
};

const buildDeleteGetPayload = (data) => {
	let result = {};
	result.url = data.url;
	result.config = data.config || {};
	if (data.params) {
		result.config.params = data.params;
	}
	if (data.headers) {
		result.config.headers = data.headers;
		result.config.headers["Content-Type"] = determineContentType(data);
	}
	if (data.pathParam) {
		for (let i in data.pathParam) {
			result.url = result.url.replace(`:${i}`, data.pathParam[i]);
		}
	}
	return result;
};

/**
 * OCC's API wraper for execution
 * @class
 * @constructor
 * @public
 */
class OCC {

	/**
	 * 
	 * @param {Object} 						data	 		- The OCC config
	 * @param {import("url").URL | String} 	data.node 		- The URL of the environment where to run the APIs
	 * @param {String} 						data.key 		- The APP_KEY to access the APIs
	 * @param {String} 						[data.siteId] 	- The site ID where to impact changens
	 */
	constructor(data) {
		/**
		 * The OCC URL
		 * @type {String|import("url").URL}
		 */
		this.node = data.node;

		/**
		 * The APP_KEY
		 * @type {String}
		 */
		this.key = data.key;

		/**
		 * Error Flag
		 * @type {Boolean}
		 */
		this.errorFlag = false;

		/**
		 * Error message
		 * @type {String}
		 */
		this.errorMsg = "";

		/**
		 * OCC's SiteId
		 * @type {String}
		 */
		this.siteId = data.siteId || "";

		/**
		 * Check if object is initialized
		 * @type {Boolean}
		 */
		this.initialized = false;

		/**
		 * The API's connector
		 * @type {Object}
		 */
		this.conector = null;

		/**
		 * Object of available endpoints
		 * @type {Object}
		 */
		this.ENDPOINTS = ENDPOINTS;
		if (!data.node || !data.key) this.setError("Missing URL or KEY");
	}

	setError(data) {
		if (!this.errorFlag) {
			this.errorFlag = true;
			this.errorMsg = typeof data === "string" ? data : `${data.status} => ${data.statusText || data.data}`;
		}
	}

	logRequestError(error) {
		error = error.response ? error.response : error;
		if (typeof error == "object") {
			logger.doLog(`***ERROR***`, true);
			logger.doLog(`status   => ${error.status}`, true);
			logger.doLog(`response => ${JSON.stringify(error.data ? error.data : error)}`, true);
		} else if (typeof error == "string") {
			logger.doLog(error, true);
		}
	}

	async init() {
		try {
			let token = await this.getToken();

			this.conector = axios.create({
				// @ts-ignore
				baseURL: this.node.origin || this.node,
				timeout: 3000,
				timeoutErrorMessage: "Error por TIMEOUT",
				headers: {
					"Authorization": `Bearer ${token}`
				},
			});

			this.initialized = true;
		} catch (e) {
			this.setError(e);
		}
	}

	async setSite(siteId) {
		if (!this.initialized) {
			await this.init();
		}
		this.conector.defaults.headers["x-ccsite"] = siteId;
	}

	async getToken() {
		try {
			// @ts-ignore
			let response = await axios.post((this.node.origin || this.node) + ENDPOINTS.LOGIN, stringifyQueryString({
				grant_type: "client_credentials",
			}), {
				headers: {
					Authorization: `Bearer ${this.key}`,
				}
			});

			return response.data.access_token;
		} catch (e) {
			this.setError(e);
			// this.logRequestError(e);
		}
	}

	async verifyToken() {
		try {
			let response = await this.post({
				url: ENDPOINTS.VERIFY,
			});
			return response.success;
		} catch (e) {
			return false;
		}
	}

	async refreshToken() {
		try {
			if (this.initialized) {
				let token = await this.getToken();
				this.conector.defaults.headers["Authorization"] = `Bearer ${token}`;
			} else {
				await this.init();
				this.initialized = true;
			}
		} catch (e) {

		}
	}

	/**
	 * Perform a GET request
	 * @param {Object} 	options 				- The get request config
	 * @param {String} 	options.url				- Endpoint
	 * @param {String} 	[options.msg]			- Message to display a temp notification
	 * @param {Object} 	[options.config]		- Request config
	 * @param {Object} 	[options.headers]		- Request headers
	 * @param {Object} 	[options.params]		- QueryParams (IE: ?someKey=SomeValue)
	 * @param {Object} 	[options.pathParam]		- PathParams (IE: /:PATH_PARAM)
	 * @param {Boolean}	[options.extendTimeOut]	- Extend the timeout request for large waiting
	 * 
	 * @returns {Promise}
	 */
	async get(options) {
		let p = new Promise(async (resolve, reject) => {
			try {
				await this.refreshToken();
				let payload = buildDeleteGetPayload(options);

				if (options.extendTimeOut) {
					this.conector.defaults.timeout = 120000;
				}

				let response = await this.conector.get(payload.url, payload.config);
				let result = processResponse(response);
				if (result.success) {
					resolve(result.data);
				} else {
					reject(result.data);
				}
			} catch (e) {
				this.logRequestError(e);
				reject(e);
			} finally {
				this.conector.defaults.timeout = 3000;
			}
		});

		if (options.msg) {
			logger.logAndTempNotification({
				msg: options.msg,
				promise: p,
			});
		}

		return p;
	}

	/**
	 * Perform a POST request
	 * @param {Object} 	options 				- The POST request config
	 * @param {String} 	options.url				- Endpoint
	 * @param {String} 	[options.msg]			- Message to display a temp notification
	 * @param {Object} 	[options.config]		- Request config
	 * @param {Object} 	[options.headers]		- Request headers
	 * @param {Object}	[options.data]			- Request body	 * 
	 * @param {Object} 	[options.query]			- QueryParams (IE: ?someKey=SomeValue)
	 * @param {Object} 	[options.pathParam]		- PathParams (IE: /:PATH_PARAM)
	 * @param {Boolean}	[options.extendTimeOut]	- Extend the timeout request for large waiting
	 * 
	 * @returns {Promise}
	 */
	async post(options) {
		let p = new Promise(async (resolve, reject) => {
			try {
				await this.refreshToken();
				let payload = buildPayload(options);

				if (options.extendTimeOut) {
					this.conector.defaults.timeout = 120000;
				}

				let response = await this.conector.post(payload.url, payload.data, payload.config);
				let result = processResponse(response);
				if (result.success) {
					resolve(result.data);
				} else {
					reject(result.data);
				}
			} catch (e) {
				this.logRequestError(e);
				reject(e.response);
			} finally {
				this.conector.defaults.timeout = 3000;
			}
		});

		if (options.msg) {
			logger.logAndTempNotification({
				msg: options.msg,
				promise: p,
			});
		}

		return p;
	}

	/**
	 * Perform a PUT request
	 * @param {Object} 	options 				- The PUT request config
	 * @param {String} 	options.url				- Endpoint
	 * @param {String} 	[options.msg]			- Message to display a temp notification
	 * @param {Object} 	[options.config]		- Request config
	 * @param {Object} 	[options.headers]		- Request headers
	 * @param {Object}	[options.data]			- Request body	 * 
	 * @param {Object} 	[options.query]			- QueryParams (IE: ?someKey=SomeValue)
	 * @param {Object} 	[options.pathParam]		- PathParams (IE: /:PATH_PARAM)
	 * @param {Boolean}	[options.extendTimeOut]	- Extend the timeout request for large waiting
	 * 
	 * @returns {Promise}
	 */
	async put(options) {
		let p = new Promise(async (resolve, reject) => {
			try {
				await this.refreshToken();
				let payload = buildPayload(options);

				if (options.extendTimeOut) {
					this.conector.defaults.timeout = 120000;
				}

				let response = await this.conector.put(payload.url, payload.data, payload.config);
				this.conector.defaults.timeout = 3000;

				let result = processResponse(response);
				if (result.success) {
					resolve(result.data);
				} else {
					reject(result.data);
				}
			} catch (e) {
				this.logRequestError(e);
				this.conector.defaults.timeout = 3000;
				reject(e);
			}
		});

		if (options.msg) {
			logger.logAndTempNotification({
				msg: options.msg,
				promise: p,
			});
		}

		return p;
	}

	/**
	 * Perform a POST request
	 * @param {Object} 	options 				- The get request config
	 * @param {String} 	options.url				- Endpoint
	 * @param {String} 	[options.msg]			- Message to display a temp notification
	 * @param {Object} 	[options.config]		- Request config
	 * @param {Object} 	[options.headers]		- Request headers
	 * @param {Object} 	[options.params]		- QueryParams (IE: ?someKey=SomeValue)
	 * @param {Object} 	[options.pathParam]		- PathParams (IE: /:PATH_PARAM)
	 * @param {Boolean}	[options.extendTimeOut]	- Extend the timeout request for large waiting
	 * 
	 * @returns {Promise}
	 */
	async delete(options) {
		let p = new Promise(async (resolve, reject) => {
			try {
				await this.refreshToken();
				let payload = buildDeleteGetPayload(options);

				if (options.extendTimeOut) {
					this.conector.defaults.timeout = 120000;
				}

				let response = await this.conector.delete(payload.url, payload.config);
				this.conector.defaults.timeout = 3000;

				let result = processResponse(response);
				if (result.success) {
					resolve(result.data);
				} else {
					reject(result.data);
				}
			} catch (e) {
				this.logRequestError(e);
				this.conector.defaults.timeout = 3000;
				reject(e);
			}
		});

		if (options.msg) {
			logger.logAndTempNotification({
				msg: options.msg,
				promise: p,
			});
		}

		return p;
	}

	async fetchLayouts() {
		try {
			let response = await this.get({
				url: ENDPOINTS.LAYOUTS,
				msg: "Buscando Layouts..."
			});

			let layouts = [];
			response.forEach((layoutType) => {
				layoutType.pageLayouts.forEach((layout) => {
					layouts.push({
						name: layout.layout.displayName,
						id: layout.layout.repositoryId
					});
				});
			});
			// layouts.unshift("*");
			return layouts;
		} catch (e) {
			return e;
		}
	}

	async fetchSites() {
		try {
			let result = [];
			let sites = await this.get({
				url: ENDPOINTS.SITES,
			});

			result.push({
				label: "TODOS",
				id: "",
				isDefault: false,
			});
			result = result.concat(
				sites.map(function (site) {
					return {
						label: site.name || site.repositoryId,
						id: site.repositoryId,
						isDefault: site.defaultSite,
					};
				})
			);
			return result;
		} catch (e) {
			return e;
		}
	}
}

module.exports = OCC;
