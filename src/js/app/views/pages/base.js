define(["app/views/base"], function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);
	}, {

		bars: [],

		render: function(){
			this._initBars();
			return BaseView.prototype.render.apply(this, arguments);
		},

		_initBars: function(){
			this._.each(this.bars, function(bar){
				this._state.dispatcher.dispatchEvent("updateBarState", bar);
			}.bind(this));
		}
	});
});