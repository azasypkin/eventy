define([ "configuration/config", "app/proxies/virtualearth", "libs/base" ], function(config, Proxy) {

    var labels = config.local.labels;

    return Base.extend({
        constructor: function() {
            this._innerResolver = new Proxy();
        },

        resolve: function(latitude, longitude) {

            var deferred = $.Deferred();

            this._innerResolver.resolveLocation({ lat: latitude, lon: longitude }).then(function (geo) {
                if (geo && geo.city){
                    deferred.resolve({
                        city: geo.city
                    });
                }
                else {
                    deferred.reject( {
                        // 2 means that detection failed at name resolving level
                        status: 2,
                        message: labels["ErrorMessages.YourLocationCannotBeFound"]
                    });
                }
            }, function (error) {
                deferred.reject( {
                    // 2 means that detection failed at name resolving level
                    status: 2,
                    // this message should be logged rather than being displayed to user
                    //message: "Geocoder failed due to: " + error,
                    message: labels["ErrorMessages.YourLocationCannotBeFound"],
                    origin: error
                });
            });

            return deferred.promise();
        }
    });
});