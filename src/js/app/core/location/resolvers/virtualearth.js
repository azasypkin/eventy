define([ "config", "app/proxies/virtualearth", "app/core/errors/base_error"], function(config, Proxy, BaseError) {
	"use strict";

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
						new BaseError(config.getString("ErrorMessages.YourLocationCannotBeFound"), BaseError.Codes.LOCATION_REQUEST_FAILED)
					);
				}
			}, function (e) {
				return WinJS.Promise.wrapError(
					new BaseError(config.getString("ErrorMessages.YourLocationCannotBeFound"), BaseError.Codes.LOCATION_REQUEST_FAILED, e)
				);
			});
		}
	});
});