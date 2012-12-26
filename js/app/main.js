define([
	"underscore",
	"config",
	"app/utils/win",
	"app/utils/template",
	"app/router",
	"app/event-dispatcher",
	"app/core/storage/adapters/roaming",
	"app/core/storage/manager",
	"app/models/user",
	"app/views/top-bar",
	"app/views/welcome",
	"app/views/categories"
], function (_, config, winUtils, templateUtils, WinRouter, dispatcher, StorageAdapter, StorageManager, User, TopBarView, WelcomePage, CategoriesPage) {
	"use strict";

	var state = {
		user: new User()
	};

	var toolBelt = {
		win: winUtils,
		template: templateUtils,
		dispatcher: dispatcher,
		storage: new StorageManager(new StorageAdapter(), config.state.storageKey)
	};

	state.user.addEventListener("changed", function(){
		toolBelt.storage.setProperty("user", state.user.toJSON());
	});

	var router = new (WinJS.Class.mix(WinRouter, {
		_page: null,
		_navigationPromise: WinJS.Promise.as(),

		_navigateTo: function(PageClass){

			this._navigationPromise.cancel();

			if (this._page) {
				this._page.unload();
			}

			this._page = new PageClass(_, config, state, toolBelt);

			return this._navigationPromise = this._page.render.apply(this._page, Array.prototype.slice.call(arguments, 1));
		},

		routes: {
			"welcome": "welcome",
			"categories": "categories"
		},

		welcome: function(){
			return this._navigateTo(WelcomePage);
		},

		categories: function(){
			return this._navigateTo(CategoriesPage);
		}
	}))();

	return {
		start: function(){
			return (new TopBarView(_, config, state, toolBelt)).render()
				.then(function(){
					return toolBelt.storage.getProperty("user");
				})
				.then(function(userData){

					if(userData){
						state.user.initialize(userData);
					}

					return WinJS.Navigation.navigate("welcome");
				});
		}
	};
});