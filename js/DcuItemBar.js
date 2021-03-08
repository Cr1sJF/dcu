const vscode = require('vscode');
module.exports = class DucItemBar {
    constructor(options) {
        let itemBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
        this.itemBar = itemBar;
        this.itemBar.command = options.command;
        this.icon = options.icon;
        this.itemBar.text = options.text || `$(${options.icon})`;
        this.itemBar.tooltip = options.tooltip || options.text;
        this.task = options.task;
        this.MSGS = {
            START: options.msg.start,
            SUCCESS: options.msg.success,
            ERROR: options.msg.error,
            WARN: options.msg.warn
        };
        this.itemBar.show();
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
            this.itemBar.text = `$(${this.icon}~spin)`;
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
}