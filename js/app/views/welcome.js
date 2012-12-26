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
					this._win.showPrompt("Hello", "World");
				}.bind(this));
			}.bind(this));
		}
	});
});