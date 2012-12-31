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