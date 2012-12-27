define(function () {
	"use strict";

	var Dispatcher = WinJS.Class.define(function(){}, {
	});

	WinJS.Class.mix(Dispatcher, WinJS.Utilities.eventMixin);
	WinJS.Class.mix(Dispatcher, WinJS.Utilities.createEventProperties("updatePageTitle"));

	return new Dispatcher();
});