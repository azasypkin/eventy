define(function () {
	"use strict";
	return WinJS.Class.define(function(adapter, storageKey){
		this._adapter = adapter;
		this._storageKey = storageKey;
	},{
		getString: function(key){
			return this._adapter.get(key);
		},

		getProperty: function (key) {
			return this._adapter.get(this._storageKey).then(function (content) {
				if (content) {
					try{
						return JSON.parse(content)[key];
					} catch(e){
					}
				}
				return null;
			});
		},

		setProperty: function (key, value) {
			return this.getProperty(key).then(function(container){
				container = container || {};

				container[key] = value;

				return this._adapter.set(this._storageKey, JSON.stringify(container));
			}.bind(this));
		}
	});
});