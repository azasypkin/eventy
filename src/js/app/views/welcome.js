define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);
	}, {

		view: "/html/views/welcome/main.html",
		container: document.getElementById("content"),

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				document.getElementById("btn-try").addEventListener("click", function(){
					var categories = this._state.user.get("categories");
					WinJS.Navigation.navigate(categories && categories.length > 0 ? "home":"firstTime_categories", {
						keepHistory: false
					});
				}.bind(this));
			}.bind(this));
		}
	});
});