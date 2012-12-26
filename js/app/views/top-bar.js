define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this.onTitleUpdateRequested = this.onTitleUpdateRequested.bind(this);

		this._helpers.dispatcher.addEventListener("titleUpdateRequested", this.onTitleUpdateRequested);
	}, {

		view: "/html/views/shared/top-bar.html",
		container: document.getElementById("top-bar"),
		_wc: null,

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(container){
				this._wc = new WinJS.UI.AppBar(container, {
					layout:'custom',
					placement:'top',
					sticky: true
				});
			}.bind(this));
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this._helpers.dispatcher.removeEventListener("titleUpdateRequested", this.onTitleUpdateRequested);
		},

		onTitleUpdateRequested: function(e){
			if(e && e.detail && e.detail.title){
				document.getElementById("page-title-container").innerText = e.detail.title;
				this._wc.show();
			}
		}
	});
});