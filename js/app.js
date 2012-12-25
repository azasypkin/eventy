// Require.js shortcut aliases
require.config({
	baseUrl: "./js",
	paths: {
		underscore: 'libs/lodash.min',
		dataProxy: 'app/proxies/eventbrite'
	},
	// uncomment to disable caching
	urlArgs: "bust=" +  (new Date()).getTime()
});

(function () {
	"use strict";

	var winApp = WinJS.Application,
		activation = Windows.ApplicationModel.Activation,
		nav = WinJS.Navigation;

	winApp.addEventListener("activated", function (args) {
		if (args.detail.kind === activation.ActivationKind.launch) {
			/*if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
				// TODO: This application has been newly launched. Initialize
				// your application here.
			} else {
				// TODO: This application has been reactivated from suspension.
				// Restore application state here.
			}*/

			/*	if (app.sessionState.history) {
					nav.history = app.sessionState.history;
				}*/
			args.setPromise(WinJS.UI.processAll().then(function () {
				require(["app/main"], function (app) {
					app.initialize();
				});
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

	winApp.start();

})();
