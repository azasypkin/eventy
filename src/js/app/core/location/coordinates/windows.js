define(["config", "app/core/errors/base_error"], function(config, BaseError) {
	"use strict";

	return WinJS.Class.define(function(){
		this._geolocator = Windows.Devices.Geolocation.Geolocator();
	},{

		getCoordinates: function () {
			return this._geolocator.getGeopositionAsync().then(function (position) {
				return {
					lat: position.coordinate.latitude,
					lon: position.coordinate.longitude
				};
			}, function (e) {
				return WinJS.Promise.wrapError(
					new BaseError(
						this._getErrorStatusMessage(this._geolocator.locationStatus),
						BaseError.Codes.LOCATION_ERROR,
						e
					)
				);
			}.bind(this));
		},

		_getErrorStatusMessage: function (status) {
			if (status === Windows.Devices.Geolocation.PositionStatus.disabled) {
				return config.local.labels["ErrorMessages.YourLocationCannotBeFoundChangePermissions"];
			} else {
				return config.local.labels["ErrorMessages.YourLocationCannotBeFound"];
			}
		}
	});
});