define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onUpdateBarState = this._onUpdateBarState.bind(this);

		this._state.dispatcher.addEventListener("updateBarState", this._onUpdateBarState);
	}, {

		wc: null,
		type: null,

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(container){
				this.wc = new WinJS.UI.AppBar(container, this.getBarProperties());

				this._addEventListeners();
			}.bind(this));
		},

		getBarProperties: function(){
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this._removeEventListeners();

			this._state.dispatcher.removeEventListener("updateBarState", this._onUpdateBarState);
		},

		_addEventListeners: function(){
			this._processEventHandlers();
		},

		_removeEventListeners: function(){
			this._processEventHandlers(true);
		},

		_processEventHandlers: function (remove) {
			var commands = this._.map(this.wc.element.querySelectorAll(".win-command"), function (commandDomNode) {
					return commandDomNode.winControl;
				}),
				command,
				i;

			for (i = 0; i < commands.length; i++) {
				command = commands[i];
				command[!remove ? "addEventListener" : "removeEventListener"](
					"click",
					this["_on" + command.id.charAt(0).toUpperCase() + command.id.slice(1) + "Clicked"]
				);
			}
		},

		_onUpdateBarState: function(e){
			if(e && e.detail){
				// if type isn't passed that means that even related to both top and bottom bars
				if(!e.detail.type || (e.detail.type && e.detail.type === this.type)){

					if (e.detail.commands && e.detail.commands.length > 0) {
						this.wc.showOnlyCommands(e.detail.commands);
					}

					if (e.detail.showCommands && e.detail.showCommands.length > 0) {
						this.wc.showCommands(e.detail.showCommands);
					}

					if (e.detail.hideCommands && e.detail.hideCommands.length > 0) {
						this.wc.hideCommands(e.detail.hideCommands);
					}

					if (e.detail.enableCommands && e.detail.enableCommands.length > 0) {
						this._.each(e.detail.enableCommands, function (commandId) {
							var command = this.wc.getCommandById(commandId);
							if (command && command.disabled) {
								command.disabled = false;
							}
						}.bind(this));
					}

					if (e.detail.disableCommands && e.detail.disableCommands.length > 0) {
						this._.each(e.detail.disableCommands, function (commandId) {
							var command = this.wc.getCommandById(commandId);
							if (command && !command.disabled) {
								command.disabled = true;
							}
						}.bind(this));
					}


					if (e.detail.enabled === true && this.wc.disabled) {
						this.wc.disabled = false;
					} else if (e.detail.enabled === false && !this.wc.disabled) {
						this.wc.disabled = true;
					}

					if(e.detail.sticky === true && !this.wc.sticky){
						this.wc.sticky = true;
					} else if(e.detail.sticky === false && this.wc.sticky){
						this.wc.sticky = false;
					}

					if(e.detail.show === true && this.wc.hidden){
						this.wc.show();
					} else if(e.detail.show === false && !this.wc.hidden){
						this.wc.hide();
					}

				}
			}
		}
	});
});