define([
	"underscore",
	"config",
	"moment",

	"app/proxies/eventbrite",
	"app/proxies/directory",
	"app/proxies/ngapi",
	"app/proxies/composite",

	"app/utils/win",
	"app/utils/template",
	"app/utils/string",

	"app/router",
	"app/dispatcher",
	"app/rate_prompt",
	"app/analytics",

	"app/core/storage/adapters/roaming",
	"app/core/storage/manager",
	"app/core/location/coordinates/windows",
	"app/core/location/resolvers/virtualearth",
	"app/core/location/manager",
	"app/core/authentication/eventbrite",
	"app/core/errors/handler",
	"app/core/cache/cache",

	"app/models/user",
	"app/models/counters",

	"app/contracts/search",
	"app/contracts/live-tiles",
	"app/contracts/share",

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
], function (_, config, moment,
			Proxy, DirectoryProxy, NGApiProxy, CompositeProxy,
			winUtils, templateUtils, stringUtils,
			WinRouter, dispatcher, RatePrompt, Analytics,
			StorageAdapter, StorageManager, CoordinatesDetector, LocationResolver, LocationManager, AuthenticationManager, ErrorHandler, Cache,
			User, Counters,
			SearchContract, LiveTilesContract, ShareContract,
			TopBarView, BottomBarView, WelcomePage, CategoriesPage, HomePage, ExplorePage, SearchPage,
			AboutSettingsView, AccountSettingsView, PrivacySettingsView
) {
	"use strict";

	var storageManager = new StorageManager(new StorageAdapter(), config.state.storageKey),
		locationManager = new LocationManager(new CoordinatesDetector(), new LocationResolver()),
		activationKinds = Windows.ApplicationModel.Activation.ActivationKind,
		state = {},
		helpers = {},
		routeExtractor = function(route){
			if(route.indexOf("explore") === 0){
				return "explore";
			}
			return route;
		},
		isCounterTracked = function(counterName){
			return counterName !== "viewedEvents" && counterName !== "ratePromptLastTime";
		},
		analytics,
		errorHandler,
		proxy;

	helpers = {
		win: winUtils,
		template: templateUtils,
		string: stringUtils,
		moment: moment,
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
	};

	state.user = new User(new AuthenticationManager(config.proxies.eventbrite, helpers));
	state.dispatcher = dispatcher;
	state.counters = new Counters(helpers);
	state.contracts = {
		search: new SearchContract(),
		liveTiles: new LiveTilesContract(),
		share: new ShareContract(config, state)
	};

	proxy = new CompositeProxy({
		config: config,
		user: state.user,
		helpers: helpers,
		mapping: [{
			type: Proxy,
			methods: ["getEvent", "searchEvents", "getUserUpcomingEvents", "getUserDetails"]
		}, {
			type: DirectoryProxy,
			methods: ["searchDirectoryEvents"]
		}, {
			type: NGApiProxy,
			methods: ["searchRelevantEvents"]
		}]
	});

	analytics = new Analytics(config, state);

	errorHandler = new ErrorHandler(config, helpers, state, analytics);

	var createView = function(ViewClass){
		return new ViewClass(_, config, proxy, state, helpers);
	};

	WinJS.UI.Pages.define("/js/templates/views/settings/about.html", createView(AboutSettingsView));
	WinJS.UI.Pages.define("/js/templates/views/settings/account.html", createView(AccountSettingsView));
	WinJS.UI.Pages.define("/js/templates/views/settings/privacy.html", createView(PrivacySettingsView));

	WinJS.Application.addEventListener("settings", function (setting) {
		setting.detail.applicationcommands = {};

		setting.detail.applicationcommands["about-setting-container"] = {
			href: "/js/templates/views/settings/about.html",
			title: "About"
		};

		setting.detail.applicationcommands["account-setting-container"] = {
			title: "Account",
			href: "/js/templates/views/settings/account.html"
		};

		setting.detail.applicationcommands["privacy-setting-container"] = {
			href: "/js/templates/views/settings/privacy.html",
			title: "Privacy Policy"
		};

		WinJS.UI.SettingsFlyout.populateSettings(setting);
	});

	var router = new (WinJS.Class.mix(WinRouter, {
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

			helpers.progress.show();

			this._navigationPromise.cancel();

			if(state.page instanceof PageClass && typeof state.page.refresh === "function"){
				this._navigationPromise = state.page.refresh.apply(state.page, Array.prototype.slice.call(arguments, 1));
			} else {
				if (state.page) {
					state.page.unload();
					state.page.removeEventListener("event", this._dispatchPageEvent, false);
				}

				state.page = createView(PageClass);

				state.page.addEventListener("event", this._dispatchPageEvent, false);

				this._navigationPromise = state.page.render.apply(state.page, Array.prototype.slice.call(arguments, 1));
			}

			return this._navigationPromise.then(function(){
				helpers.progress.hide();
			}, function(e){
				helpers.progress.hide();

				return WinJS.Promise.wrapError(e);
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
			state.counters.set("viewedEvents", state.counters.get("viewedEvents") + 1);
			return this._navigateTo(ExplorePage, id, params);
		},

		category: function(category){
			return this._navigateTo(SearchPage, null, category);
		},

		refresh: function(){
			return this._navigateTo(state.page.constructor);
		}
	}))();

	router.addEventListener("route", function(data){
		state.dispatcher.dispatchEvent("route", data.detail);
	}, false);

	router.addEventListener("page:exited", function(e){
		state.dispatcher.dispatchEvent("page:exited", routeExtractor(e.detail));
	}, false);

	router.addEventListener("page:entered", function(e){
		state.dispatcher.dispatchEvent("page:entered", routeExtractor(e.detail));
	}, false);

	state.user.addEventListener("initialized", function(data){
		state.dispatcher.dispatchEvent("user:initialized", data);
	}, false);

	state.user.addEventListener("changed", function(){
		storageManager.setProperty("user", state.user.toJSON());
	});

	state.counters.addEventListener("changed", function(e){
		storageManager.setProperty("counters", state.counters.toJSON());

		if (e.detail) {
			if (isCounterTracked(e.detail.key)) {
				state.dispatcher.dispatchEvent("track:event", e.detail.key);
			}
		}
	});

	state.contracts.search.addEventListener("query:submitted", function(e){
		if(e.detail.queryText){
			WinJS.Navigation.navigate("search/" + e.detail.queryText);
		} else {
			WinJS.Navigation.navigate("search");
		}
		state.dispatcher.dispatchEvent("search:requested");
	}, false);

	state.contracts.share.addEventListener("requested", function(){
		state.dispatcher.dispatchEvent("share:requested");
	}, false);

	state.dispatcher.addEventListener("command:categories", function(){
		WinJS.Navigation.navigate("categories");
	}, false);

	state.dispatcher.addEventListener("command:search", function(){
		WinJS.Navigation.navigate("search");
	}, false);

	state.dispatcher.addEventListener("command:location", function(){
		locationManager.getLocation().then(function (location) {
			var previousLocation = state.user.get("location");

			if (location && (!previousLocation || previousLocation.lat !== location.lat || previousLocation.lon !== location.lon)) {
				state.user.set("location", location);
				router.refresh();
			}
		}, function () {
			helpers.win.showPrompt(
				"Your location cannot be found.",
				"Please, change your Permissions in Settings to allow Eventy to access your location"
			);
		});
	}, false);

	(new RatePrompt(helpers, state.counters)).setup();

	return {
		_isInitialized: false,

		start: function (winApp, activationDetail) {
			var initPromise,
				navigateToInitialPage = function (e) {
					if (state.user.isAuthenticated() || !state.counters.get("firstTimeVisit")) {
						var userCategories = state.user.get("categories");
						if(userCategories && userCategories.length > 0){
							if(e.kind === activationKinds.launch){
								return WinJS.Navigation.navigate("home");
							} else if (e.kind === activationKinds.search) {
								if (e.queryText) {
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
				state.contracts.share.setup();
				analytics.setup();

				winApp.addEventListener("error", function(e){
					return errorHandler.handle(e);
				}, false);

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
						return user ? state.user.initialize(user) : WinJS.Promise.wrap();
					});
				})
				.then(function(){
					var location = state.user.get("location");

					if (location) {
						navigateToInitialPage(activationDetail);
					} else {
						// detect location
						WinJS.Promise.timeout(5000, locationManager.getLocation()).then(function(location){
							state.user.set("location", location);
							navigateToInitialPage(activationDetail);
						}, function(){
							navigateToInitialPage(activationDetail);
						});
					}

					this._isInitialized = true;
				}.bind(this));
		}
	};
});