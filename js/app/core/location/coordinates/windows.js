define(["configuration/config", "libs/base"], function(config) {

    var labels = config.local.labels;

    return Base.extend({

        constructor: function () {
            this._geolocator = Windows.Devices.Geolocation.Geolocator();
        },

        getCoordinates: function () {

            var dfd = $.Deferred(),
                self = this;

            this._geolocator.getGeopositionAsync().done(function (position) {
                dfd.resolve({
                    lat: position.coordinate.latitude,
                    lon: position.coordinate.longitude
                });
            }, function (error) {
                dfd.reject( {
                    // 1 means that detection failed at browser\os level
                    status: 1,
                    message: self._getErrorStatusMessage(self._geolocator.locationStatus),
                    origin: error
                });
            });

            return dfd.promise();
        },

        _getErrorStatusMessage: function (status) {
            switch (status) {
                case Windows.Devices.Geolocation.PositionStatus.disabled:
                    return labels["ErrorMessages.YourLocationCannotBeFoundChangePermissions"];
                default:
                    return labels["ErrorMessages.YourLocationCannotBeFound"];
            }
        }
    });
});