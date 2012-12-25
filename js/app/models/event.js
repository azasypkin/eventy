define(function () {
	"use strict";

	return WinJS.Class.define(function(options){
		this.id = options.id;
		this.title = options.title;
		this.thumbnail = options.thumbnail;
		this.url = options.url;
		this.date = options.date;
		this.categories = options.categories;
		this.popularity = options.popularity;
		this.description = options.description;
		this.city = options.city;
		this.venue = options.venue;
		this.country = options.country;
	});
});