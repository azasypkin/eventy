define(function () {
	"use strict";

	var User = WinJS.Class.define(function(authenticator, data){
		this._authenticator = authenticator;
		this.initialize(data);
	}, {

		initialize: function(data){
			this._innerData = data || {};
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

		authenticate: function(){
			return this._authenticator.authenticate().then(function (token) {
				if (token) {
					this.set("token", token);
					return true;
				} else {
					return false;
				}
			}.bind(this));
		}
	});

	WinJS.Class.mix(User, WinJS.Utilities.eventMixin);
	WinJS.Class.mix(User, WinJS.Utilities.createEventProperties("changed"));

	return User;
});