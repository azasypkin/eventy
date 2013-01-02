define(["app/views/base"], function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);
	}, {

		searchOnKeyboardInput: false,

		layout: WinJS.UI.GridLayout,

		render: function(){
			this._initBars();

			this._state.contracts.search.setShowOnKeyboardInput(this.searchOnKeyboardInput);

			return BaseView.prototype.render.apply(this, arguments);
		},

		getBarsSettings: function(){
			return [];
		},

		_initBars: function(){
			this._.each(this.getBarsSettings(), function(bar){
				this._state.dispatcher.dispatchEvent("updateBarState", bar);
			}.bind(this));
		}
	});
});