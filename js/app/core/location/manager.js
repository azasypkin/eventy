define([
	"configuration/config",
    "libs/base"
],	function (config) {
		return Base.extend({

			constructor: function (coordinatesDetector, resolver) {
				this._detector = coordinatesDetector;
                this._resolver = resolver;
			},

			getLocation: function(){
                var self = this;
                return this._detector.getCoordinates().pipe(function(coordinates){
                    return self._resolver.resolve(coordinates.lat, coordinates.lon).pipe(function(result){
                        return {
                            lat: coordinates.lat,
                            lon: coordinates.lon,
                            city: result.city
                        }
                    });
                });
            }
		});
	}
);