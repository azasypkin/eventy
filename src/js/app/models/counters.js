define(function () {
	"use strict";

	var Counters = WinJS.Class.define(function(helpers){
		this._innerData = {
			_buildDate: helpers.string.format("{major}.{minor}.{revision}.{build}", Windows.ApplicationModel.Package.current.id.version),
			// user first time visit
			firstTimeVisit: true,
			// user agreed to rate application
			userAgreedToRate: false,
			// user declined to rate application
			userDeclinedToRate: false,
			// user postponed to rate application
			userPostponedToRate: false,
			// user postponed to rate application at the specified time
			ratePromptLastTime: null
		};
		this._helpers = helpers;
	}, {

		initialize: function(data){
			// if we trying to initialize with data from another build, reset counters to default,
			// and copy only what we want from old data
			if(data){
				if (data._buildDate !== this._innerData._buildDate) {
					if(data.userDeclinedToRate){
						this._innerData.userDeclinedToRate = data.userDeclinedToRate;
					}
					if(data.userAgreedToRate){
						this._innerData.userAgreedToRate = data.userAgreedToRate;
					}
				} else {
					this._innerData = data;
				}
			}

			this.dispatchEvent("initialized");
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

		toJSON: function(){
			return this._innerData;
		}
	});

	WinJS.Class.mix(Counters, WinJS.Utilities.eventMixin);

	return Counters;
});