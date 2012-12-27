define(function () {
	"use strict";

	return WinJS.Class.define(function(parameters){
		this.city = parameters.city;
		this.countryName = parameters.countryName;
		this.countryCode = parameters.countryCode;
	});
});