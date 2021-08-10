const vscode = require("vscode");
module.exports = class DcuItemBar {
	constructor(options) {
		let itemBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, options.align || 1);
		// itemBar.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
		// itemBar.color = "green"
		this.itemBar = itemBar;
		this.itemBar.command = options.command;
		this.icon = options.icon;
		this.itemBar.text = options.text || `$(${options.icon})`;
		this.itemBar.tooltip = options.tooltip || options.text;
		this.task = options.task;
		this.type = options.type;
		this.hidden = options.hidden;
		this.MSGS = {
			start: options.msg.start,
			success: options.msg.success,
			error: options.msg.error,
			warn: options.msg.warn,
			trackingMsg: options.msg.trackingMsg,
		};
		if (this.hidden) {
			this.hide();
		}
	}

	show() {
		this.itemBar.show();
	}

	hide() {
		this.itemBar.hide();
	}

	toggleSpinIcon() {
		if (this.icon) {
			if (this.itemBar.text.indexOf("spin") != -1) {
				this.itemBar.text = `$(${this.icon})`;
			} else {
				this.itemBar.text = `$(loading~spin)`;
			}
		}
	}

	spin() {
		if (this.icon) {
			this.itemBar.text = `$(loading~spin)`;
		}
	}

	stopSpin() {
		if (this.icon) {
			this.itemBar.text = `$(${this.icon})`;
		}
	}

	success() {
		this.itemBar.text = `$(pass)`;
		setTimeout(() => {
			this.itemBar.text = `$(${this.icon})`;
		}, 3000);
	}

	fail() {
		this.itemBar.text = `$(error)`;
		setTimeout(() => {
			this.itemBar.text = `$(${this.icon})`;
		}, 3000);
	}

	warn() {
		this.itemBar.text = `$(extensions-warning-message)`;
		setTimeout(() => {
			this.itemBar.text = `$(${this.icon})`;
		}, 2000);
	}
};
