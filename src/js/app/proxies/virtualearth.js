define(["config", "app/utils/datetime", "app/models/geo"], function(config, dateUtils, Geo) {
	"use strict";

	return WinJS.Class.define(function(options){
		options = options || {};
		this._config = config.proxies.virtualearth;
		this._url = options.url || this._config.url;
		this._appKey = options.appKey || this._config.appKey;
	},{
		_buildUrl: function(lat, lon){
			return this._url + lat + "," + lon + "?key=" + this._appKey;
		},

		resolveLocation: function (params) {

			return WinJS.xhr({
				url: this._buildUrl(params.lat, params.lon),
				responseType: this._config.dataType,
				headers: {"Content-Type": "application/json; charset=utf-8"},
				timeout: this._config.timeout
			}).then(function(data){
				var result = null;
				
				try{
					data = JSON.parse(data.responseText);
				} catch (e) {
				}

				if (data && (data.resourceSets instanceof Array)
					&& data.resourceSets[0]
					&& (data.resourceSets[0].resources instanceof Array)
					&& data.resourceSets[0].resources[0]
					&& data.resourceSets[0].resources[0].address) {

					var address = data.resourceSets[0].resources[0].address;

					if (address.locality){
						result = new Geo({ city: address.locality });
					}
				}
				return result;
			});
		}
	});
});