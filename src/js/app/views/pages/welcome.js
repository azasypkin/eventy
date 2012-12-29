define(["app/views/pages/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);
	}, {

		view: "/html/views/pages/welcome/main.html",
		container: document.getElementById("content"),

		bars: [{
			enabled: false
		}],

		_navigateToNextPage: function(){
			var categories = this._state.user.get("categories");
			WinJS.Navigation.navigate(categories && categories.length > 0 ? "home":"firstTime_categories", {
				keepHistory: false
			});
		},

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				document.getElementById("btn-try").addEventListener("click", function(){
					this._navigateToNextPage();
				}.bind(this));
				document.getElementById("btn-signin").addEventListener("click", function(){
					this._state.user.authenticate().then(function (result) {
						if (result) {
							this._navigateToNextPage();
						}
					}.bind(this), function(){
						this._helpers.win.showPrompt(
							"Unable to connect to Eventbrite",
							"There was a problem trying to connect to Eventbrite. Please try again later."
						);
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}
	});
});