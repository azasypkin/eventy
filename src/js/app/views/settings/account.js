define(function () {
	"use strict";

	return WinJS.Class.define(function(_, config, proxy, state, helpers){
		this._ = _;
		this._config = config;
		this._proxy = proxy;
		this._state = state;
		this._helpers = helpers;

		this.ready = this.ready.bind(this);
	},{
		ready: function (element, options) {

			this._toggleState(element);

			element.querySelector("#btn-account").addEventListener("click", function () {
				if(this._state.user.isAuthenticated()){
					this._state.user.signOut();

					this._toggleState(element);

					WinJS.Navigation.navigate("welcome");
				} else {
					this._state.user.authenticate(this._proxy).then(function (result) {
						if (result) {
							this._navigateToNextPage();
						}
					}.bind(this), function(){
						this._helpers.win.showPrompt(
							"Unable to connect to Eventbrite",
							"There was a problem trying to connect to Eventbrite. Please try again later."
						);
					}.bind(this));
				}
			}.bind(this));
		},

		_toggleState: function (element) {
			var accountButton = element.querySelector("#btn-account"),
				accountDescription = element.querySelector("#account-description");

			if (this._state.user.isAuthenticated()) {
				accountButton.innerText = "Sign Out";
				accountDescription.innerText = "Once you sign out you will be able to use all features except viewing of your personal events.";
			} else {
				accountDescription.innerText = "Once you connect to Eventbrite you will be able to see your personal Eventbrite events.";
				accountButton.innerText = "Sign In";
			}
		},

		_navigateToNextPage: function(){
			var categories = this._state.user.get("categories"),
				isFirstTimeVisit = this._state.counters.get("firstTimeVisit");
			if(isFirstTimeVisit && (!categories || categories.length <= 0)){
				WinJS.Navigation.navigate("firstTime_categories", {
					keepHistory: false
				}).then(function(){
					this._state.counters.set("firstTimeVisit", false);
				}.bind(this));
			} else {
				WinJS.Navigation.navigate("home", {
					keepHistory: !isFirstTimeVisit
				});
			}
		}
	});
});