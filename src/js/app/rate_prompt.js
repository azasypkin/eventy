define(function () {
	"use strict";

	return WinJS.Class.define(function(helpers, counters){
		this._helpers = helpers;
		this._counters = counters;
		this._triggerName = "viewedEvents";
		this._millisecondInDay = 1000*60*60*24;
		this._triggerValueToShowRatePrompt = 15;
		this._daysCountToShowRatePrompt = 4;
	},{
		setup: function(){
			var showPromptHandler = function () {
				this.show().done(function (result) {
					// let's be good citizens: remove stumble click\touch listener in case user agreed\declined to rate
					if (result && result.status === "agreedOrDeclined") {
						this._counters.removeEventListener("changed:" + this._triggerName, showPromptHandler);
					}
				}.bind(this));
			}.bind(this);

			this._counters.addEventListener("changed:" + this._triggerName, showPromptHandler);
		},

		validate: function(){
			var result = {
				succeed: false,
				status: "notRatedYet"
			},
			ratePromptLastTime,
			daysFromPreviousPrompt;

			if(this._counters.get("userAgreedToRate") !== true && this._counters.get("userDeclinedToRate") !== true){
				if(this._counters.get("userPostponedToRate") === true){
					ratePromptLastTime = this._counters.get("ratePromptLastTime");
					daysFromPreviousPrompt = (this._helpers.date.convertDateToUTC(new Date()).getTime() - ratePromptLastTime) / this._millisecondInDay;

					result.succeed = daysFromPreviousPrompt >= this._daysCountToShowRatePrompt;
				} else {
					result.succeed = this._counters.get(this._triggerName) >= this._triggerValueToShowRatePrompt;
				}
			} else {
				result.status = "agreedOrDeclined";
			}
			return result;
		},

		provideParameters: function(){
			return {
				title: "Rate Eventy 5 stars!",
				message: "Did we help you to find some cool events? So, rate us!",
				commands: [{
					id: "agreedCmd",
					label: "Yes",
					handler: function () {
						return this._helpers.win.launchURI(
							"ms-windows-store:REVIEW?PFN=" + Windows.ApplicationModel.Package.current.id.familyName
						).then(function(){
							// save user's positive choice only in case user successfully opened store review form
							// unfortunately this case can't catch internet connection problems
							this._counters.set("userAgreedToRate", true);
						}.bind(this));
					}.bind(this)
				}, {
					id: "postponedCmd",
					label: "Maybe Later",
					handler: function () {
						this._counters.set("userPostponedToRate", true);
						this._counters.set("ratePromptLastTime", this._helpers.date.convertDateToUTC(new Date()).getTime());
					}.bind(this)
				}, {
					id: "declinedCmd",
					label: "No",
					handler: function () {
						this._counters.set("userDeclinedToRate", true);
					}.bind(this)
				}],
				defaultCommandIndex: 0,
				// when user press Escape button we should just postpone rate prompt and not decline
				cancelCommandIndex: 1
			};
		},

		show: function(){
			var validationResult = this.validate();
			if (validationResult.succeed) {
				return this._helpers.win.showPrompt(this.provideParameters()).then(function(promptResult){
					// check command id to know dialog result
					if(promptResult && (promptResult.id === "agreedCmd" || promptResult.id === "declinedCmd")){
						validationResult.status = "agreedOrDeclined";
					}
					return validationResult;
				});
			} else {
				return WinJS.Promise.wrap(validationResult);
			}
		}
	});
});