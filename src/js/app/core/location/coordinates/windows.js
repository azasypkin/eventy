﻿define(["config", "app/core/errors/base_error"], function(config, BaseError) {
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
						BaseError.Codes.LOCATION_REQUEST_FAILED,
						e
					)
				);
			}.bind(this));
		},

		_getErrorStatusMessage: function (status) {
			if (status === Windows.Devices.Geolocation.PositionStatus.disabled) {
				return config.getString("ErrorMessages.YourLocationCannotBeFoundChangePermissions");
			} else {
				return config.getString("ErrorMessages.YourLocationCannotBeFound");
			}
		}
	});
});