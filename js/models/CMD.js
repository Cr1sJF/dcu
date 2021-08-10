const { spawn } = require("child_process");
const logger = require("../controllers/logger");
class CMD {
	constructor(data) {
		this.task = data.task;
		this.cwd = data.cwd;
	}

	run() {
		return new Promise((resolve, reject) => {
			try {
				let dcuProccess = spawn(this.task, [], { shell: true, cwd: this.cwd });
				let stderr = "",
					data = "";
				dcuProccess.stdout.on("data", (d) => {
					logger.doLog(d.toString().trim(), true);
					data += `${d}`;
				});

				dcuProccess.stderr.on("data", (d) => {
					logger.doLog(d.toString().trim(), true);
					stderr += `${d}`;
				});

				dcuProccess.on("close", (code) => {
					try {

						resolve({
							data: data,
							error: stderr,
							sterror: stderr,
							code: code,
						});
					} catch (e) {
						reject({
							code: 1,
							error: e
						});
					}
				});
			} catch (e) {
				reject({
					error: e,
					code: 1,
				});
			}
		})
	}
}

module.exports = CMD;