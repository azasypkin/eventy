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
	"app/core/authentication/eventbrite",
	"app/models/user",
	"app/views/bars/top-bar",
	"app/views/bars/bottom-bar",
	"app/views/pages/welcome",
	"app/views/pages/categories",
	"app/views/pages/home",
	"app/views/pages/explore"
], function (_, config, winUtils, templateUtils, WinRouter, dispatcher, StorageAdapter, StorageManager, CoordinatesDetector, LocationResolver, LocationManager, AuthenticationManager, User, TopBarView, BottomBarView, WelcomePage, CategoriesPage, HomePage, ExplorePage) {
	"use strict";

	var storageManager = new StorageManager(new StorageAdapter(), config.state.storageKey),
		locationManager = new LocationManager(new CoordinatesDetector(), new LocationResolver()),
		state = {
			user: new User(new AuthenticationManager(config.proxies.eventbrite, winUtils)),
			dispatcher: dispatcher
		},
		toolBelt = {
			win: winUtils,
			template: templateUtils
		};

	var createView = function(ViewClass){
		return new ViewClass(_, config, state, toolBelt);
	};

	state.user.addEventListener("changed", function(){
		storageManager.setProperty("user", state.user.toJSON());
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
			"home": "home",
			"explore/:id" : "explore"
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
		},

		explore: function(id, params){
			if(this._page instanceof ExplorePage){
				return this._page.refresh(id, params);
			} else {
				return this._navigateTo(ExplorePage, id, params);
			}
		}
	}))();

	router.addEventListener("route", function(data){
		state.dispatcher.dispatchEvent("route", data.detail);
	});

	return {
		start: function () {

			var navigateToInitialPage = function () {
				if (state.user.isAuthenticated()) {
					var userCategories = state.user.get("categories");
					if(userCategories && userCategories.length > 0){
						return WinJS.Navigation.navigate("home");
					} else {
						return WinJS.Navigation.navigate("categories");
					}
				} else {
					return WinJS.Navigation.navigate("welcome");
				}
			};

			return WinJS.Promise.join([createView(BottomBarView).render(), createView(TopBarView).render()])
				.then(function(){
					return storageManager.getProperty("user");
				})
				.then(function(userData){

					if(userData){
						state.user.initialize(userData);
					}

					// detect location
					locationManager.getLocation().then(function(location){
						state.user.set("location", location);
						navigateToInitialPage();
					}, function (e) {
						navigateToInitialPage();
					});
				});
		}
	};
});