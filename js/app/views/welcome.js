define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);
	}, {

		view: "/views/welcome.html",
		container: document.getElementById("content"),

		render: function(){
			return BaseView.prototype.render.apply(this, arguments);
		}
	});
});