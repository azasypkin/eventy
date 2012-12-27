define(function () {
	"use strict";

	var winNavigation = WinJS.Navigation,
		// Cached regular expressions for matching named param parts and splatted
		// parts of route strings.
		namedParam = /:\w+/g,
		splatParam = /\*\w+/g,
		escapeRegExp = /[\-\[\\\]{}()+?.,\\\^$|#\s]/g;

	// Convert a route string into a regular expression, suitable for matching
	// against the current location hash. Taken from backbone
	var routeToRegExp = function (route) {
		route = route.replace(escapeRegExp, '\\$&')
			.replace(namedParam, '([^\/]+)')
			.replace(splatParam, '(.*?)');
		return new RegExp('^' + route + '$');
	},

	// Given a route, and a URL fragment that it matches, return the array of extracted parameters.
	// Taken from backbone
	extractParameters = function (route, fragment) {
		return route.exec(fragment).slice(1);
	};

	var WinRouter = WinJS.Class.define(function () {

		//this.beforenavigate = this.beforenavigate.bind(this);
		this.navigating = this.navigating.bind(this);
		this.navigated = this.navigated.bind(this);

		//winNavigation.addEventListener("beforenavigate", this.beforenavigate);
		winNavigation.addEventListener("navigating", this.navigating);
		winNavigation.addEventListener("navigated", this.navigated);

		this.prepareHandlers(this.routes);

	}, {
		routes: {},
		handlers: [],

		beforenavigate: function (e) {
			// we should prevent navigation to the same URL twice
			if(e.detail.location === WinJS.Navigation.location){
				e.preventDefault();
			}
		},
		navigating: function (e) {
			var fragment = e.detail.location,
				options = e.detail.state,
				length = this.handlers.length,
				handler,
				i;

			// do the same override as backbone router does
			if (!options || options === true) {
				options = {
					trigger: true
				};
			} else if(typeof options.trigger === "undefined"){
				options.trigger = true;
			}

			// modifying history depending on input parameters
			if (options.keepHistory === false) {
				winNavigation.history.backStack = [];
			} else if (options.replace === true && winNavigation.history.backStack.length > 0) {
				// on that step our current view is already placed to backStack, let's just remove it
				winNavigation.history.backStack.pop();
			}

			if (options && options.trigger === true) {
				for (i = 0; i < length; i++) {
					handler = this.handlers[i];
					if (handler.route.test(fragment)) {
						// callback may take some time
						e.detail.setPromise(WinJS.Promise.as(handler.callback(fragment)));
						break;
					}
				}
			} else if (options && options.trigger === false){
				e.preventDefault();
			}
		},

		navigated: function () {
			// now we should set trigger to true as it should be triggered when user press back button
			winNavigation.history.current.state = {
				trigger: true
			};
		},

		prepareHandlers: function (routes) {
			var routeValue,
				routeKey,
				routeKeys,
				i;
			if(routes){
				routeKeys = Object.keys(routes);
				for(i = 0; i < routeKeys.length; i++){
					routeKey = routeKeys[i];

					routeValue = routes[routeKey];
					this.route(routeKey, routeValue, this[routeValue]);
				}
			}
		},

		route: function (route, name, callback) {
			route = routeToRegExp(route);
			if (!callback) {
				callback = this[name];
			}
			this.handlers.push({
				key: route,
				route: route,
				callback: function (fragment) {
					var args = extractParameters(route, fragment);

					this.dispatchEvent("route", {
						parameters: args,
						route: fragment
					});

					return callback ? callback.apply(this, args) : WinJS.Promise.wrap();
				}.bind(this)
			});
		},

		navigate: function (destination, options) {
			winNavigation.navigate(destination, options);
		},

		dispose: function () {
			winNavigation.removeEventListener("beforenavigate", this.beforenavigate);
			winNavigation.removeEventListener("navigating", this.navigating);
			winNavigation.removeEventListener("navigated", this.navigated);

			this.handlers = null;
			this.routes = null;
		}
	});

	WinJS.Class.mix(WinRouter, WinJS.Utilities.eventMixin);
	WinJS.Class.mix(WinRouter, WinJS.Utilities.createEventProperties("route"));

	return WinRouter;
});