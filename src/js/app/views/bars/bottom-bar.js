define(["app/views/bars/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this._onEditCategoriesClicked = this._onEditCategoriesClicked.bind(this);
	}, {

		view: "/html/views/bars/bottom-bar.html",
		container: document.getElementById("bottom-bar"),

		type: "bottom",

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				document.getElementById("cmdEditCategories").addEventListener("click", this._onEditCategoriesClicked);
			}.bind(this));
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			document.getElementById("cmdEditCategories").removeEventListener("click", this._onEditCategoriesClicked);
		},

		getBarProperties: function(){
			return {
				layout:'custom',
				placement: this.type,
				disabled: true
			};
		},

		_onEditCategoriesClicked: function(){
			WinJS.Navigation.navigate("categories");
		}
	});
});