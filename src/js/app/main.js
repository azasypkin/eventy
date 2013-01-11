define([
	"underscore",
	"config",

	"app/proxies/eventbrite",

	"app/utils/win",
	"app/utils/template",
	"app/utils/string",
	"app/utils/format",
	"app/utils/datetime",

	"app/router",
	"app/dispatcher",
	"app/rate_prompt",

	"app/core/storage/adapters/roaming",
	"app/core/storage/manager",
	"app/core/location/coordinates/windows",
	"app/core/location/resolvers/virtualearth",
	"app/core/location/manager",
	"app/core/authentication/eventbrite",

	"app/models/user",
	"app/models/counters",

	"app/contracts/search",
	"app/contracts/live-tiles",

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
], function (_, config,
			Proxy,
			winUtils, templateUtils, stringUtils, formatUtils, dateUtils,
			WinRouter, dispatcher, RatePrompt,
			StorageAdapter, StorageManager, CoordinatesDetector, LocationResolver, LocationManager, AuthenticationManager,
			User, Counters,
			SearchContract, LiveTilesContract,
			TopBarView, BottomBarView, WelcomePage, CategoriesPage, HomePage, ExplorePage, SearchPage,
			AboutSettingsView, AccountSettingsView, PrivacySettingsView
) {

	"use strict";

	var storageManager = new StorageManager(new StorageAdapter(), config.state.storageKey),
		locationManager = new LocationManager(new CoordinatesDetector(), new LocationResolver()),
		toolBelt = {
			win: winUtils,
			template: templateUtils,
			string: stringUtils,
			format: formatUtils,
			date: dateUtils,
			progress: {
				_progress: document.getElementById("progress-indicator-holder"),
				show: function(){
					this._progress.style.visibility = "visible";
				},
				hide: function(){
					this._progress.style.visibility = "hidden";
				}
			},
			noData: {
				_noData: document.getElementById("no-data-holder"),
				show: function(){
					WinJS.Utilities.addClass(this._noData, "active");
				},
				hide: function(){
					WinJS.Utilities.removeClass(this._noData, "active");
				}
			}
		},
		state = {
			user: new User(new AuthenticationManager(config.proxies.eventbrite, toolBelt)),
			dispatcher: dispatcher,
			counters: new Counters(toolBelt),
			contracts: {
				search: new SearchContract(),
				liveTiles: new LiveTilesContract()
			}
		},
		proxy = new Proxy({
			user: state.user
		}),
		activationKinds = Windows.ApplicationModel.Activation.ActivationKind;

	var createView = function(ViewClass){
		return new ViewClass(_, config, proxy, state, toolBelt);
	};

	WinJS.UI.Pages.define("/html/views/settings/about.html", createView(AboutSettingsView));
	WinJS.UI.Pages.define("/html/views/settings/account.html", createView(AccountSettingsView));
	WinJS.UI.Pages.define("/html/views/settings/privacy.html", createView(PrivacySettingsView));

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

	state.user.addEventListener("changed", function(){
		storageManager.setProperty("user", state.user.toJSON());
	});

	state.counters.addEventListener("changed", function(){
		storageManager.setProperty("counters", state.counters.toJSON());
	});

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

	state.dispatcher.addEventListener("command:next", function(){
		var currentNumberOfViewedEvents = state.counters.get("viewedEvents") + 1;
		state.counters.set("viewedEvents", currentNumberOfViewedEvents);
	});

	(new RatePrompt(toolBelt, state.counters)).setup();

	return {
		_isInitialized: false,

		start: function (activationDetail) {
			var initPromise,
				navigateToInitialPage = function (e) {
					if (state.user.isAuthenticated() || !state.counters.get("firstTimeVisit")) {
						var userCategories = state.user.get("categories");
						if(userCategories && userCategories.length > 0){
							if(e.kind === activationKinds.launch){
								return WinJS.Navigation.navigate("home");
							} else if (e.kind === activationKinds.search) {
								if (e.detail.queryText) {
									return WinJS.Navigation.navigate("search/" + e.queryText);
								} else {
									return WinJS.Navigation.navigate("search");
								}
							}
						} else {
							return WinJS.Navigation.navigate("firstTime_categories");
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

			return initPromise
				.then(function(){
					return storageManager.getProperty("counters").then(function(counters){
						if(counters){
							state.counters.initialize(counters);
						}
					});
				})
				.then(function(){
					return storageManager.getProperty("user").then(function(user){
						if(user){
							return state.user.initialize(user);
						}
					});
				})
				.then(function(){
					var location = state.user.get("location");

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