define(["app/utils/string"], function (str) {
	"use strict";

	return {
		ready: function (element, options) {
			element.querySelector("#app-version").innerText = str.format(
				"{major}.{minor}.{revision}.{build}",
				Windows.ApplicationModel.Package.current.id.version
			);
		}
	};
});