define([
    "configuration/config",
    "libs/requirejs/plugins/async!http://maps.google.com/maps/api/js?sensor=false!callback",
    "libs/base"
],
    function(config) {

        var labels = config.local.labels;

		return Base.extend({

			constructor: function () {
				this._innerResolver = new google.maps.Geocoder();
			},

			resolve: function (latitude, longitude) {

                var deferred = $.Deferred();

                this._innerResolver.geocode({ 'latLng': new google.maps.LatLng(latitude, longitude) }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results && results[0]) {
                            var city = null;
                            var arrAddress = results[0].address_components;

                            for (var i = 0; i < arrAddress.length; i++) {
                                if (arrAddress[i].types[0] == "locality") {
                                    city = arrAddress[i].long_name;
                                    break;
                                }
                            }

                            if (city){
                                deferred.resolve({
                                    city: city
                                });
                            }
                            else {
                                deferred.reject( {
                                    // 2 means that detection failed at name resolving level
                                    status: 2,
                                    message: labels["ErrorMessages.YourLocationCannotBeFound"]
                                });
                            }
                        } else {
                            deferred.reject( {
                                // 2 means that detection failed at name resolving level
                                status: 2,
                                message: labels["ErrorMessages.YourLocationCannotBeFound"]
                            });
                        }
                    } else {
                        deferred.reject( {
                            // 2 means that detection failed at name resolving level
                            status: 2,
                            // this message should be logged rather than being displayed to user
                            //message: "Geocoder failed due to: " + status,
                            message: labels["ErrorMessages.YourLocationCannotBeFound"],
                            origin: status
                        });
                    }
                });

                return deferred.promise();
			}
		});
	}
);