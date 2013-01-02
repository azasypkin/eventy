define(function () {
	"use strict";

	return WinJS.Class.define(function(coordinatesDetector, resolver){
		this._detector = coordinatesDetector;
		this._resolver = resolver;
	},{
		getLocation: function(){
			return this._detector.getCoordinates().then(function(coordinates){
				return this._resolver.resolve(coordinates.lat, coordinates.lon).then(function(result){
					return {
						lat: coordinates.lat,
						lon: coordinates.lon,
						city: result.city
					};
				}, function(e){
					return {
						lat: coordinates.lat,
						lon: coordinates.lon
					};
				});
			}.bind(this));
		}
	});
});