define(["app/utils/string"], function (str) {
	"use strict";

	return {
		state: null,
		helpers: null,

		ready: function (element, options) {
			
			this._toggleState();

			this.element.querySelector("#btn-account").addEventListener("click", function () {
				if(this.state.user.isAuthenticated()){
					this.state.user.signOut();

					this._toggleState();

					WinJS.Navigation.navigate("welcome");
				} else {
					this.state.user.authenticate().then(function (result) {
						var categories;
						if (result) {
							categories = this.state.user.get("categories");
							WinJS.Navigation.navigate(categories && categories.length > 0 ? "home" : "firstTime_categories", {
								keepHistory: false
							});
						}
					}.bind(this), function () {
						this.helpers.win.showPrompt(
							"Unable to connect to Eventbrite",
							"There was a problem trying to connect to Eventbrite. Please try again later."
						);
					}.bind(this));
				}
			}.bind(this));
		},

		_toggleState: function () {
			var accountButton = this.element.querySelector("#btn-account"),
				accountDescription = this.element.querySelector("#account-description");

			if (this.state.user.isAuthenticated()) {
				accountButton.innerText = "Sign Out";
				accountDescription.innerText = "Once you sign out you will be able to use all features except viewing of your personal events.";
			} else {
				accountDescription.innerText = "Once you connect to Eventbrite you will be able to see your personal Eventbrite events."
				accountButton.innerText = "Sign In";
			}
		}
	};
});