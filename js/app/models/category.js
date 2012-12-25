define(function () {
	"use strict";

	return WinJS.Class.define(function(options){
		this.id = options.id;
		this.eventsInCategory = options.eventsInCategory;
		this.popularEvent = options.popularEvent;
	});
});