define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	return WinJS.Class.define(function(){
		this._isSupported = this._checkIfLocalStorageSupported();
	}, {

		_checkIfLocalStorageSupported: function () {
			try {
				return 'localStorage' in window && window.localStorage !== null;
			} catch (e) {
				return false;
			}
		},

		_localStorageNotSupported: function(){
			return WinJS.Promise.wrapError(
				new BaseError("LocalStorage isn't supported.", BaseError.Codes.STORAGE_REQUEST_FAILED)
			);
		},

		get: function (key) {
			return this._isSupported
				? WinJS.Promise.wrap(localStorage.getItem(key) || "{}")
				: this._localStorageNotSupported();
		},

		set: function (key, content) {
			return this._isSupported
				? WinJS.Promise.wrap(localStorage.setItem(key, content))
				: this._localStorageNotSupported();
		},

		remove: function (key) {
			return this._isSupported
				? WinJS.Promise.wrap(localStorage.removeItem(key))
				: this._localStorageNotSupported();
		}
	});
}
);