define([
	"underscore",
	"config",
	"app/utils/win",
	"app/utils/template",
	"app/router",
	"app/dispatcher",
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
	"app/views/pages/explore",
	"app/views/pages/search",

	"app/views/settings/about",
	"app/views/settings/account",
	"app/views/settings/privacy"
], function (_, config, winUtils, templateUtils, WinRouter, dispatcher, StorageAdapter, StorageManager, CoordinatesDetector, LocationResolver, LocationManager, AuthenticationManager, User, TopBarView, BottomBarView, WelcomePage, CategoriesPage, HomePage, ExplorePage, SearchPage, AboutSettingsView, AccountSettingsView, PrivacySettingsView) {
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
		},
		activationKinds = Windows.ApplicationModel.Activation.ActivationKind;

	var createView = function(ViewClass){
		return new ViewClass(_, config, state, toolBelt);
	};

	// define settings
	AccountSettingsView.state = state;
	AccountSettingsView.helpers = toolBelt;

	WinJS.UI.Pages.define("/html/views/settings/about.html", AboutSettingsView);
	WinJS.UI.Pages.define("/html/views/settings/account.html", AccountSettingsView);
	WinJS.UI.Pages.define("/html/views/settings/privacy.html", PrivacySettingsView);

	WinJS.Application.addEventListener("settings", function (setting) {
		setting.detail.applicationcommands = {};

		setting.detail.applicationcommands["about-setting-container"] = {
			href: "/html/views/settings/about.html",
			title: "About"
		};

		setting.detail.applicationcommands["account-setting-container"] = {
			title: "Account",
			href: "/html/views/settings/account.html"
		};

		setting.detail.applicationcommands["privacy-setting-container"] = {
			href: "/html/views/settings/privacy.html",
			title: "Privacy Policy"
		};

		WinJS.UI.SettingsFlyout.populateSettings(setting);
	});

	state.user.addEventListener("changed", function(){
		storageManager.setProperty("user", state.user.toJSON());
	});

	var router = new (WinJS.Class.mix(WinRouter, {
		_page: null,
		_navigationPromise: WinJS.Promise.as(),

		_dispatchPageEvent: function(e){
			if(e.detail.name){
				state.dispatcher.dispatchEvent(
					e.target.eventPrefix ? e.target.eventPrefix + ":" + e.detail.name : e.detail.name,
					e.detail.data
				);
			}
		},

		_navigateTo: function(PageClass){

			var progress = document.getElementById("progress-indicator-holder");

			progress.style.visibility = "visible";

			this._navigationPromise.cancel();

			if (this._page) {
				this._page.unload();
				this._page.removeEventListener("event", this._dispatchPageEvent, false);
			}

			this._page = createView(PageClass);

			this._page.addEventListener("event", this._dispatchPageEvent, false);

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
			"explore/:id" : "explore",
			"search/:query": "search",
			"search": "search"
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

		search: function(query){
			return this._navigateTo(SearchPage, query);
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

	state.user.addEventListener("initialized", function(data){
		state.dispatcher.dispatchEvent("user:initialized", data);
	});

	return {
		start: function (e) {

			var navigateToInitialPage = function (e) {
				if (state.user.isAuthenticated()) {
					var userCategories = state.user.get("categories");
					if(userCategories && userCategories.length > 0){
						if(e.kind === activationKinds.launch){
							return WinJS.Navigation.navigate("home");
						} else if(e.kind === activationKinds.search){
							return WinJS.Navigation.navigate("search/" + e.queryText);
						}
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
						navigateToInitialPage(e);
					}, function (e) {
						navigateToInitialPage(e);
					});
				});
		}
	};
});