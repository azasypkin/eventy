define(["app/views/base"], function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);
	}, {

		render: function(){
			this._initBars();
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