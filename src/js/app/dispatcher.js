define(function () {
	"use strict";

	var Dispatcher = WinJS.Class.define(function(){}, {
	});

	WinJS.Class.mix(Dispatcher, WinJS.Utilities.eventMixin);

	return new Dispatcher();
});