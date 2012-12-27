define(["app/views/bars/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this._onBackButtonClicked = this._onBackButtonClicked.bind(this);
	}, {

		view: "/html/views/bars/top-bar.html",
		container: document.getElementById("top-bar"),

		type: "top",

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				document.getElementById("cmdBack").addEventListener("click", this._onBackButtonClicked);
			}.bind(this));
		},

		getBarProperties: function(){
			return {
				layout:'custom',
				placement: this.type,
				sticky: true,
				disabled: true
			};
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			document.getElementById("cmdBack").removeEventListener("click", this._onBackButtonClicked);
		},

		_updateBackButtonState: function(){
			document.getElementById("cmdBack").disabled = !WinJS.Navigation.canGoBack;
		},

		_onUpdateBarState: function(e){
			BaseView.prototype._onUpdateBarState.apply(this, arguments);
			if(e && e.detail){
				// if type isn't passed that means that even related to both top and bottom bars
				if(!e.detail.type || (e.detail.type && e.detail.type === this.type)){
					if(e.detail.title){
						document.getElementById("page-title-container").innerText = e.detail.title;
					}
				}
			}
		},

		_onRoute: function(){
			BaseView.prototype._onRoute.apply(this, arguments);

			this._updateBackButtonState();
		},

		_onBackButtonClicked: function(){
			WinJS.Navigation.back(1);
		}
	});
});