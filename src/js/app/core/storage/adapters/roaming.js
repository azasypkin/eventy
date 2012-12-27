define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	return WinJS.Class.define(function(){
		this._roaming = WinJS.Application.roaming;
	}, {

		_storageError: function(e){
			return WinJS.Promise.wrapError(
				new BaseError("Unexpected storage error.", BaseError.Codes.STORAGE_ERROR, e)
			);
		},

		get: function (key) {
			return this._roaming.exists(key)
				.then(function(exists){
					return exists ? this._roaming.readText(key) : null;
				}.bind(this))
				.then(null, function(e){
					return this._storageError(e);
				}.bind(this));
		},

		set: function (key, content) {
			return this._roaming.writeText(key, content)
				.then(null, function (e) {
					return this._storageError(e);
				}.bind(this));
		},

		remove: function (key) {
			return this._roaming.exists(key)
				.then(function(exists){
				return exists ? this._roaming.remove(key) : null;
			}.bind(this))
				.then(null, function(e){
				return this._storageError(e);
			}.bind(this));
		}
	});
}
);