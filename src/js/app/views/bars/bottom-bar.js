define(["app/views/bars/base", "app/views/search-refine"],function(BaseView, SearchRefineView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onCommandClicked = this._onCommandClicked.bind(this);

		this._searchRefine = Object.create(SearchRefineView.prototype);
		SearchRefineView.apply(this._searchRefine, arguments);

		this.container.addEventListener("click", this._onCommandClicked);
	}, {

		view: "/html/views/bars/bottom-bar.html",
		container: document.getElementById("bottom-bar"),

		type: "bottom",

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				return this._searchRefine.render(document.getElementById("refine"));
			}.bind(this));
		},

		getBarProperties: function(){
			return {
				layout:'custom',
				placement: this.type,
				disabled: true
			};
		},

		_onUpdateBarState: function(e){
			var secondaryTitle,
				parameters = e && e.detail;
			BaseView.prototype._onUpdateBarState.apply(this, arguments);
			if(parameters){
				// if type isn't passed that means that even related to both top and bottom bars
				if(!parameters.type || (parameters.type && parameters.type === this.type)){
					if (parameters.filter) {
						this._searchRefine.update(parameters.filter);
					}
				}
			}
		},

		_onCommandClicked: function(e){
			if(e.target && e.target.winControl && e.target.winControl instanceof WinJS.UI.AppBarCommand){
				if(e.target.winControl.id === "refine"){
					this._searchRefine.show();
				} else {
					this._state.dispatcher.dispatchEvent("command:" + e.target.winControl.id);
				}
			}
		}
	});
});