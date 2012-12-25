(function () {
	"use strict";

	WinJS.UI.Pages.define("/pages/home/home.html", {
		// This function is called whenever a user navigates to this page. It
		// populates the page elements with the app's data.
		ready: function (element, options) {
			// TODO: Initialize the page here.
			require(["app/proxies/eventbrite"], function (Proxy) {
				var proxy = new Proxy();

				proxy.searchEvents({
					date: "next_month"
				}).then(function (response) {
					var p = response;
				}, function (e) {
					var p = e;
				});

			});
		}
	});
})();
