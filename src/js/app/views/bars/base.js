define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this._onUpdateBarState = this._onUpdateBarState.bind(this);

		this._helpers.dispatcher.addEventListener("updateBarState", this._onUpdateBarState);
	}, {

		wc: null,
		type: null,

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(container){
				this.wc = new WinJS.UI.AppBar(container, this.getBarProperties());
			}.bind(this));
		},

		getBarProperties: function(){
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this._helpers.dispatcher.removeEventListener("updateBarState", this._onUpdateBarState);
		},

		_onUpdateBarState: function(e){
			if(e && e.detail){
				// if type isn't passed that means that even related to both top and bottom bars
				if(!e.detail.type || (e.detail.type && e.detail.type === this.type)){

					if(e.detail.enabled === true && this.wc.disabled){
						this.wc.disabled = false;
					} else if(e.detail.enabled === false && !this.wc.disabled){
						this.wc.disabled = true;
					}

					if(e.detail.show === true && this.wc.hidden){
						this.wc.show();
					} else if(e.detail.show === false && !this.wc.hidden){
						this.wc.hide();
					}
				}
			}
		}
	});
});