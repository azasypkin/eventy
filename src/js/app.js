﻿(function () {
	"use strict";

	// Require.js shortcut aliases
	require.config({
		baseUrl: "../js",
		paths: {
			config: "app/config/config",
			underscore: 'libs/lodash.min',
			dataProxy: 'app/proxies/eventbrite'
		},
		// uncomment to disable caching
		urlArgs: "bust=" +  (new Date()).getTime()
	});

	WinJS.Binding.optimizeBindingReferences = true;

	var app = WinJS.Application;
	var activation = Windows.ApplicationModel.Activation;
	var nav = WinJS.Navigation;

	app.addEventListener("activated", function (args) {
		if (args.detail.kind === activation.ActivationKind.launch) {
			if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
				// TODO: This application has been newly launched. Initialize
				// your application here.
			} else {
				// TODO: This application has been reactivated from suspension.
				// Restore application state here.
			}

			if (app.sessionState.history) {
				nav.history = app.sessionState.history;
			}
			args.setPromise(WinJS.UI.processAll().then(function () {
				return new WinJS.Promise(function(complete){
					require(["app/main"], function(app){
						app.start(args.detail).then(function(){
							complete();
						});
					});
				});
				/*if (nav.location) {
					nav.history.current.initialPlaceholder = true;
					return nav.navigate(nav.location, nav.state);
				} else {
					return nav.navigate(Application.navigator.home);
				}*/
			}));
		}
	});

	/*app.oncheckpoint = function (args) {
		// TODO: This application is about to be suspended. Save any state
		// that needs to persist across suspensions here. If you need to
		// complete an asynchronous operation before your application is
		// suspended, call args.setPromise().
		app.sessionState.history = nav.history;
	};*/

	app.start();
})();
