define(function () {
	"use strict";

	var User = WinJS.Class.define(function(authenticator, data){
		this._authenticator = authenticator;
		this.initialize(data);
	}, {

		initialize: function(data){
			var initializationPromise;

			this._innerData = data || {};

			// we need to reinitialize user token if it's present avoiding user interaction
			// in case something wrong with token: user revoked access or token is expired, we'll try to renew it with the
			// minimal user interaction and in the worst case we remove all user specific data and force user go to
			// welcome page again
			//if(this.get("token")){
			//	initializationPromise = this._authenticator.retrieveToken(this.get("code")).then(function(token){
			//		if (token) {
			//			this.set("token", token);
			//		} else {
			//			this.signOut();
			//		}
			//	}.bind(this), function(){
			//		this.signOut();

			//		return WinJS.Promise.wrap();
			//	}.bind(this));
			//} else {
			//	initializationPromise = WinJS.Promise.wrap();
			//}

			//return initializationPromise.then(function(){
				this.dispatchEvent("initialized");
			//}.bind(this));
		},

		set: function(key, value){
			this._innerData[key] = value;

			this.dispatchEvent("changed", {
				key: key,
				value: value
			});
		},

		get: function(key){
			return this._innerData[key];
		},

		isAuthenticated: function(){
			return !!this.get("token");
		},

		toJSON: function(){
			return this._innerData;
		},

		authenticate: function(proxy){
			return this._authenticator.authenticate()
				.then(function (authenticationData) {
					if (authenticationData) {
						this.set("code", authenticationData.code);
						this.set("token", authenticationData.token);
						return true;
					} else {
						return false;
					}
				}.bind(this))
				.then(function(isTokenReceived){
					if(isTokenReceived){
						return proxy.getUserDetails().then(function (details) {
							if (details) {
								this.set("id", details.id);
								this.set("email", details.email);

								return true;
							}
							return false;
						}.bind(this));
					}
					return isTokenReceived;
				}.bind(this));
		},

		signOut: function(){
			this.set("code", null);
			this.set("token", null);
			this.set("id", null);
			this.set("email", null);
		}
	});

	WinJS.Class.mix(User, WinJS.Utilities.eventMixin);
	WinJS.Class.mix(User, WinJS.Utilities.createEventProperties("changed"));

	return User;
});