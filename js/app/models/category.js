define(["libs/base"], function (Base) {
	"use strict";

	return Base.define(function(options){
		this.id = options.id;
		this.eventsInCategory = options.eventsInCategory;
		this.popularEvent = options.popularEvent;
	});
});