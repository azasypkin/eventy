define([
    "configuration/config",
    "libs/base"
], function(config) {

        var labels = config.local.labels;

		return Base.extend({

			constructor: function () {
				this._isSupported = !!navigator.geolocation;
			},

			getCoordinates: function () {

                var dfd = $.Deferred();

                if (this._isSupported) {

                    navigator.geolocation.getCurrentPosition(function (position) {
                        dfd.resolve({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        });
                    }, function (error) {
                        dfd.reject( {
                            // 1 means that detection failed at browser\os level
                            status: 1,
                            message: labels["ErrorMessages.YourLocationCannotBeFound"],
                            origin: error
                        });
                    });

                } else {
                    dfd.reject( {
                        // 1 means that detection failed at browser\os level
                        status: 1,
                        message: labels["ErrorMessages.YourLocationCannotBeFoundChangePermissions"]
                    });
                }

                return dfd.promise();
			}
		});
	}
);