define([ "config", "app/proxies/virtualearth", "app/core/errors/base_error"], function(config, Proxy, BaseError) {
	"use strict";

	var labels = config.local.labels;

	return WinJS.Class.define(function(){
		this._innerResolver = new Proxy();
	},{
		resolve: function(latitude, longitude) {
			return this._innerResolver.resolveLocation({ lat: latitude, lon: longitude }).then(function (geo) {
				if (geo && geo.city){
					return {
						city: geo.city
					};
				}
				else {
					return WinJS.Promise.wrapError(
						new BaseError(labels["ErrorMessages.YourLocationCannotBeFound"], BaseError.Codes.LOCATION_ERROR)
					);
				}
			}, function (e) {
				return WinJS.Promise.wrapError(
					new BaseError(labels["ErrorMessages.YourLocationCannotBeFound"], BaseError.Codes.LOCATION_ERROR, e)
				);
			});
		}
	});
});