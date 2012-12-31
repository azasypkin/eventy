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

	"app/contracts/search",

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
], function (_, config, winUtils, templateUtils, WinRouter, dispatcher,
			StorageAdapter, StorageManager, CoordinatesDetector, LocationResolver, LocationManager, AuthenticationManager,
			User,
			SearchContract,
			TopBarView, BottomBarView, WelcomePage, CategoriesPage, HomePage, ExplorePage, SearchPage,
			AboutSettingsView, AccountSettingsView, PrivacySettingsView
) {

	"use strict";

	var storageManager = new StorageManager(new StorageAdapter(), config.state.storageKey),
		locationManager = new LocationManager(new CoordinatesDetector(), new LocationResolver()),
		state = {
			user: new User(new AuthenticationManager(config.proxies.eventbrite, winUtils)),
			dispatcher: dispatcher,
			contracts: {
				search: new SearchContract()
			}
		},
		toolBelt = {
			win: winUtils,
			template: templateUtils,
			progress: {
				_progress: document.getElementById("progress-indicator-holder"),
				show: function(){
					this._progress.style.visibility = "visible";
				},
				hide: function(){
					this._progress.style.visibility = "hidden";
				}
			}
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

			toolBelt.progress.show();

			this._navigationPromise.cancel();

			if(this._page instanceof PageClass && typeof this._page.refresh === "function"){
				this._navigationPromise = this._page.refresh.apply(this._page, Array.prototype.slice.call(arguments, 1));
			} else {
				if (this._page) {
					this._page.unload();
					this._page.removeEventListener("event", this._dispatchPageEvent, false);
				}

				this._page = createView(PageClass);

				this._page.addEventListener("event", this._dispatchPageEvent, false);

				this._navigationPromise = this._page.render.apply(this._page, Array.prototype.slice.call(arguments, 1));
			}

			return this._navigationPromise.then(function(){
				toolBelt.progress.hide();
			});
		},

		routes: {
			"welcome": "welcome",
			"categories": "categories",
			"firstTime_categories": "firstTime_categories",
			"home": "home",
			"explore/:id" : "explore",
			"search/:query": "search",
			"search": "search",
			"category/:category":"category"
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
			return this._navigateTo(ExplorePage, id, params);
		},

		category: function(category){
			return this._navigateTo(SearchPage, null, category);
		},

		refresh: function(){
			return this._navigateTo(this._page.constructor);
		}
	}))();

	router.addEventListener("route", function(data){
		state.dispatcher.dispatchEvent("route", data.detail);
	}, false);

	state.user.addEventListener("initialized", function(data){
		state.dispatcher.dispatchEvent("user:initialized", data);
	}, false);

	state.contracts.search.addEventListener("query:submitted", function(e){
		if(e.detail.queryText){
			WinJS.Navigation.navigate("search/" + e.detail.queryText);
		} else {
			WinJS.Navigation.navigate("search");
		}
	}, false);

	state.dispatcher.addEventListener("command:categories", function(){
		WinJS.Navigation.navigate("categories");
	}, false);

	state.dispatcher.addEventListener("command:search", function(){
		WinJS.Navigation.navigate("search");
	}, false);

	state.dispatcher.addEventListener("command:location", function(){
		locationManager.getLocation().then(function (location) {
			var previousLocation = state.user.get("location"),
				filter = state.user.get("filter") || {};

			if (location && (!previousLocation || previousLocation.lat !== location.lat || previousLocation.lon !== location.lon)) {
				state.user.set("location", location);
				// we also have to update location in last user filter as user forced change of location
				if(location.city){
					filter.location = location.city;
					state.user.set("filter", filter);
				}
				router.refresh();
			}
		}, function () {
			toolBelt.win.showPrompt(
				"Your location cannot be found.",
				"Please, change your Permissions in Settings to allow Eventy to access your location"
			);
		});
	}, false);

	return {
		_isInitialized: false,

		start: function (activationDetail) {
			var initPromise,
				navigateToInitialPage = function (e) {
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

			if(this._isInitialized){
				initPromise = WinJS.Promise.wrap();
			} else {
				state.contracts.search.setup();

				initPromise = WinJS.Promise.join([createView(BottomBarView).render(), createView(TopBarView).render()]);
			}

			return initPromise.then(function(){
					return storageManager.getProperty("user");
				})
				.then(function(userData){
					var location;

					if(userData){
						state.user.initialize(userData);
					}

					location = state.user.get("location");

					if (location && location.city) {
						navigateToInitialPage(activationDetail);
					} else {
						// detect location
						WinJS.Promise.timeout(5000, locationManager.getLocation()).then(function(location){
							state.user.set("location", location);
							navigateToInitialPage(activationDetail);
						}, function(e){
							navigateToInitialPage(activationDetail);
						});
					}

					this._isInitialized = true;
				}.bind(this));
		}
	};
});