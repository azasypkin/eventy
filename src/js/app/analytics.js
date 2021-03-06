﻿define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	return WinJS.Class.define(function(config, state){
		this._onShareRequested = this._onShareRequested.bind(this);
		this._onSearchRequested = this._onSearchRequested.bind(this);

		this._onAccountConnected = this._onAccountConnected.bind(this);
		this._onAccountFailedToConnect = this._onAccountFailedToConnect.bind(this);

		this._onExploreCommand = this._onExploreCommand.bind(this);

		this._config = config;
		this._state = state;

		this._isSetup = false;
	}, {
		setup: function(){
			MK.initialize(this._config.analyticsKey);

			this._state.dispatcher.addEventListener("share:requested", this._onShareRequested, false);
			this._state.dispatcher.addEventListener("search:requested", this._onSearchRequested, false);

			this._state.dispatcher.addEventListener("account:connected", this._onAccountConnected, false);
			this._state.dispatcher.addEventListener("account:failedToConnect", this._onAccountFailedToConnect, false);

			this._state.dispatcher.addEventListener("page:entered", this._onPageEntered, false);
			this._state.dispatcher.addEventListener("page:exited", this._onPageExited, false);

			this._state.dispatcher.addEventListener("command:explore", this._onExploreCommand, false);

			this._state.dispatcher.addEventListener("track:event", this._onEventTrackRequested, false);

			this._isSetup = true;
		},

		log: function (entryName) {

		},

		error: function(e){
			if(this._isSetup){
				MK.error(e.message, e);
			}
		},

		logLastChanceException: function (e) {
			if(this._isSetup){
				MK.logLastChanceException(e);
			}
		},

		unload: function(){
			this._state.dispatcher.removeEventListener("share:requested", this._onShareRequested, false);
			this._state.dispatcher.removeEventListener("search:requested", this._onSearchRequested, false);

			this._state.dispatcher.removeEventListener("account:connected", this._onAccountConnected, false);
			this._state.dispatcher.removeEventListener("account:failedToConnect", this._onAccountFailedToConnect, false);

			this._state.dispatcher.removeEventListener("command:explore", this._onExploreCommand, false);

			this._state.dispatcher.removeEventListener("page:entered", this._onPageEntered, false);
			this._state.dispatcher.removeEventListener("page:exited", this._onPageExited, false);

			this._state.dispatcher.removeEventListener("track:event", this._onEventTrackRequested, false);
		},

		_onShareRequested: function (e) {
			MK.shareStarted(WinJS.Navigation.location);
		},

		_onSearchRequested: function (e) {
			var page = WinJS.Navigation.location,
				parts;
			if(page){
				parts = page.split("/");

				if(parts.length === 2){
					MK.searchRequested(parts[0], parts[1]);
				}
			}
		},

		_onAccountConnected: function(){
			MK.sessionEvent("Account connected");
		},

		_onAccountFailedToConnect: function(){
			MK.sessionEvent("Failed to connect account");
		},

		_onExploreCommand: function(){
			MK.sessionEvent("Exploring event");
		},

		_onPageEntered: function(e){
			MK.enterPage(e.detail);
		},

		_onPageExited: function(e){
			MK.exitPage(e.detail);
		},

		_onEventTrackRequested: function(e){
			MK.sessionEvent(e.detail);
		}
	});
});
