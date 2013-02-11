define(["app/core/errors/base_error"], function (BaseError) {
		"use strict";

		return WinJS.Class.define(function(){
			this._innerStorage = WinJS.Application.local;
		}, {

			_storageError: function(e){
				return WinJS.Promise.wrapError(
					new BaseError("Unexpected storage error.", BaseError.Codes.STORAGE_REQUEST_FAILED, e)
				);
			},

			get: function (key) {
				return this._innerStorage.exists(key)
					.then(function(exists){
					return exists ? this._innerStorage.readText(key) : null;
				}.bind(this))
					.then(null, function(e){
					return this._storageError(e);
				}.bind(this));
			},

			set: function (key, content) {
				return this._innerStorage.writeText(key, content)
					.then(null, function (e) {
					return this._storageError(e);
				}.bind(this));
			},

			remove: function (key) {
				return this._innerStorage.exists(key)
					.then(function(exists){
					return exists ? this._innerStorage.remove(key) : null;
				}.bind(this))
					.then(null, function(e){
					return this._storageError(e);
				}.bind(this));
			}
		});
	}
);