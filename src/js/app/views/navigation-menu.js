define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onMenuClicked = this._onMenuClicked.bind(this);

		this._onNavigationUpdate = this._onNavigationUpdate.bind(this);

		this._state.dispatcher.addEventListener("user:initialized", this._onNavigationUpdate, false);
		this._state.dispatcher.addEventListener("categories:saved", this._onNavigationUpdate, false);
	}, {

		container: document.getElementById("navigation-menu"),

		render: function(anchor){
			this.wc = new WinJS.UI.Menu(this.container, {
				anchor: anchor,
				placement: "bottom",
				alignment: "left"
			});

			this._fillCommands();

			this.container.addEventListener("click", this._onMenuClicked, false);

			return WinJS.Promise.wrap();
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this.container.removeEventListener("click", this._onMenuClicked, false);

			this._state.dispatcher.removeEventListener("user:initialized", this._onNavigationUpdate, false);
			this._state.dispatcher.removeEventListener("categories:saved", this._onNavigationUpdate, false);
		},

		show: function(){
			this.wc.show();
		},

		_fillCommands: function(){
			// check whether user has selected any categories
			var commands = [
				{
					id: "home",
					label: this._config.labels["Header.HomeView"],
					type: "button"
				},{
					id: "categories",
					label: this._config.labels["Header.CategoriesView"],
					type: "button"
				}],
				categories = this._state.user.get("categories");

			if(categories && categories.length > 0){
				commands.push({
					id: "separator:categories",
					type: "separator"
				});

				this._.each(categories, function (categoryId) {
					commands.push({
						id:		"category/" + categoryId,
						label:	this._config.dictionaries.categories[categoryId].name,
						type:	"button"
					});
				}.bind(this));
			}

			this.wc.commands = commands;
		},

		_onMenuClicked: function(e){
			if(e.target && e.target.winControl && e.target.winControl instanceof  WinJS.UI.MenuCommand){

				this.raiseEvent("navigated", {
					name: e.target.winControl.label
				});

				WinJS.Navigation.navigate(e.target.winControl.id);
			}
		},

		_onNavigationUpdate: function () {
			this._fillCommands();
		}
	});
});