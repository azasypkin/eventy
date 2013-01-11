define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	return WinJS.Class.define(function(state){
		this._onShareRequested = this._onShareRequested.bind(this);
		this._onSearchRequested = this._onSearchRequested.bind(this);

		this._onAccountConnected = this._onAccountConnected.bind(this);
		this._onAccountFailedToConnect = this._onAccountFailedToConnect.bind(this);

		this._onExploreCommand = this._onExploreCommand.bind(this);

		this._state = state;
	}, {
		setup: function(){
			MK.initialize("6cf127dd-2695-4901-b76b-ef64d7079e89");

			MK.registerNavigationFrame();

			this._state.dispatcher.addEventListener("share:requested", this._onShareRequested, false);
			this._state.dispatcher.addEventListener("search:requested", this._onSearchRequested, false);

			this._state.dispatcher.addEventListener("account:connected", this._onAccountConnected, false);
			this._state.dispatcher.addEventListener("account:failedToConnect", this._onAccountFailedToConnect, false);

			this._state.dispatcher.addEventListener("command:explore", this._onExploreCommand, false);
		},

		log: function (entryName) {

		},

		logLastChanceException: function (e) {
			MK.logLastChanceException(e);
		},

		unload: function(){
			this._state.dispatcher.removeEventListener("share:requested", this._onShareRequested, false);
			this._state.dispatcher.removeEventListener("search:requested", this._onSearchRequested, false);

			this._state.dispatcher.removeEventListener("account:connected", this._onAccountConnected, false);
			this._state.dispatcher.removeEventListener("account:failedToConnect", this._onAccountFailedToConnect, false);

			this._state.dispatcher.removeEventListener("command:explore", this._onExploreCommand, false);
		},

		_onShareRequested: function (e) {
			MK.shareStarted(WinJS.Navigation.location);
		},

		_onSearchRequested: function (e) {
			MK.searchRequested(WinJS.Navigation.location);
		},

		_onAccountConnected: function(){
			MK.sessionEvent("Account connected");
		},

		_onAccountFailedToConnect: function(){
			MK.sessionEvent("Failed to connect account");
		},

		_onExploreCommand: function(){
			MK.sessionEvent("Exploring event");
		}
	});
});
