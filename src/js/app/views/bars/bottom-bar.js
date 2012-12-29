define(["app/views/bars/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this._onEditCategoriesClicked = this._onEditCategoriesClicked.bind(this);
		this._onExploreClicked = this._onExploreClicked.bind(this);
		this._onOpenInBrowserClicked = this._onOpenInBrowserClicked.bind(this);
		this._onNextClicked = this._onNextClicked.bind(this);
	}, {

		view: "/html/views/bars/bottom-bar.html",
		container: document.getElementById("bottom-bar"),

		type: "bottom",

		getBarProperties: function(){
			return {
				layout:'custom',
				placement: this.type,
				disabled: true
			};
		},

		_onEditCategoriesClicked: function(){
			WinJS.Navigation.navigate("categories");
		},

		_onExploreClicked: function(){
			this._state.dispatcher.dispatchEvent("exploreCommandInvoked");
		},

		_onOpenInBrowserClicked: function(){
			this._state.dispatcher.dispatchEvent("openInBrowserCommandInvoked");
		},

		_onNextClicked: function(){
			this._state.dispatcher.dispatchEvent("nextCommandInvoked");
		}
	});
});