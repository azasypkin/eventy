define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);
	}, {

		view: "/html/views/categories/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/categories/item.html"
		},

		_wc: null,

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._helpers.template.parseTemplateToDomNode(this.templates.item, item.data);
			}.bind(this));
		},

		_createListView: function(container){
			var categoryKeys = Object.keys(this._config.dictionaries.categories),
				data = [],
				categoryKey,
				i;

			for(i = 0; i < categoryKeys.length; i++){
				categoryKey = categoryKeys[i];

				data.push({
					id: categoryKey,
					data: this._config.dictionaries.categories[categoryKey]
				});
			}

			this._wc = new WinJS.UI.ListView(document.getElementById("categories-list-view"), {
				layout: {type: WinJS.UI.GridLayout},
				itemDataSource: (new WinJS.Binding.List(data)).dataSource,
				itemTemplate: this._itemTemplate.bind(this)
			});
		},

		render: function(){
			this._helpers.dispatcher.dispatchEvent("titleUpdateRequested", {
				title: "Choose your categories"
			});
			return BaseView.prototype.render.apply(this, arguments)
				.then(this._createListView.bind(this));
		}
	});
});