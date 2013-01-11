define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	return WinJS.Class.define(function(state){
		this._onShareRequested = this._onShareRequested.bind(this);

		this._state = state;
	}, {
		setup: function(){
			MK.initialize("6cf127dd-2695-4901-b76b-ef64d7079e89");

			MK.registerNavigationFrame();

			this._state.dispatcher.addEventListener("share:requested", this._onShareRequested, false);
		},

		log: function (entryName) {

		},

		logLastChanceException: function (e) {
			MK.logLastChanceException(e);
		},

		unload: function(){
			this._state.dispatcher.removeEventListener("share:requested", this._onShareRequested, false);
		},

		_onShareRequested: function (e) {
			MK.sessionEvent("Share Event");
		}
	});
});
