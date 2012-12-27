define([
	"underscore",
	"config",
	"app/utils/win",
	"app/utils/template",
	"app/router",
	"app/event-dispatcher",
	"app/core/storage/adapters/roaming",
	"app/core/storage/manager",
	"app/core/location/coordinates/windows",
	"app/core/location/resolvers/virtualearth",
	"app/core/location/manager",
	"app/models/user",
	"app/views/bars/top-bar",
	"app/views/bars/bottom-bar",
	"app/views/welcome",
	"app/views/categories",
	"app/views/home"
], function (_, config, winUtils, templateUtils, WinRouter, dispatcher, StorageAdapter, StorageManager, CoordinatesDetector, LocationResolver, LocationManager, User, TopBarView, BottomBarView, WelcomePage, CategoriesPage, HomePage) {
	"use strict";

	var state = {
		user: new User()
	};

	var toolBelt = {
		win: winUtils,
		template: templateUtils,
		dispatcher: dispatcher,
		storage: new StorageManager(new StorageAdapter(), config.state.storageKey),
		location: new LocationManager(new CoordinatesDetector(), new LocationResolver())
	};

	var createView = function(ViewClass){
		return new ViewClass(_, config, state, toolBelt);
	};

	state.user.addEventListener("changed", function(){
		toolBelt.storage.setProperty("user", state.user.toJSON());
	});

	var router = new (WinJS.Class.mix(WinRouter, {
		_page: null,
		_navigationPromise: WinJS.Promise.as(),

		_navigateTo: function(PageClass){

			var progress = document.getElementById("progress-indicator-holder");

			progress.style.visibility = "visible";

			this._navigationPromise.cancel();

			if (this._page) {
				this._page.unload();
			}

			this._page = createView(PageClass);

			return this._navigationPromise = this._page.render.apply(this._page, Array.prototype.slice.call(arguments, 1))
				.then(function(){
					progress.style.visibility = "hidden";
				});
		},

		routes: {
			"welcome": "welcome",
			"categories": "categories",
			"firstTime_categories": "firstTime_categories",
			"home": "home"
		},

		welcome: function(){
			return this._navigateTo(WelcomePage);
		},

		firstTime_categories: function(){
			return this._navigateTo(CategoriesPage, true);
		},

		categories: function(){
			return this._navigateTo(CategoriesPage);
		},

		home: function(){
			return this._navigateTo(HomePage);
		}
	}))();

	router.addEventListener("route", function(data){
		toolBelt.dispatcher.dispatchEvent("route", data.detail);
	});

	return {
		start: function(){

			createView(BottomBarView).render();

			return createView(TopBarView).render()
				.then(function(){
					return toolBelt.storage.getProperty("user");
				})
				.then(function(userData){

					if(userData){
						state.user.initialize(userData);
					}

					if(state.user.isAuthenticated()){
						return WinJS.Navigation.navigate("home");
					} else {
						return WinJS.Navigation.navigate("welcome");
					}
				});
		}
	};
});