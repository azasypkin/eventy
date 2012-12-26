define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);
	}, {

		view: "/html/views/shared/top-bar.html",
		container: document.getElementById("top-bar"),
		_wc: null,

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(container){
				this._wc = new WinJS.UI.AppBar(container, {
					layout:'custom',
					placement:'top'
				});
			}.bind(this));
		}
	});
});