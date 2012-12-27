define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this.onSaveButtonClicked = this.onSaveButtonClicked.bind(this);
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
				currentUserCategories = this._state.user.get("categories") || [],
				data = [],
				selection = [],
				categoryKey,
				i;

			for(i = 0; i < categoryKeys.length; i++){
				categoryKey = categoryKeys[i];

				data.push({
					id: categoryKey,
					data: this._config.dictionaries.categories[categoryKey]
				});

				if(currentUserCategories.indexOf(categoryKey) >= 0){
					selection.push(i);
				}
			}

			this._wc = new WinJS.UI.ListView(document.getElementById("category-list-view"), {
				layout: {type: WinJS.UI.GridLayout},
				itemDataSource: (new WinJS.Binding.List(data)).dataSource,
				itemTemplate: this._itemTemplate.bind(this)
			});

			this._wc.selection.set(selection);
		},

		render: function(){
			this._helpers.dispatcher.dispatchEvent("titleUpdateRequested", {
				title: "Choose your categories"
			});
			return BaseView.prototype.render.apply(this, arguments)
				.then(this._createListView.bind(this)).then(function(){
					document.getElementById("btn-save-categories")
						.addEventListener("click", this.onSaveButtonClicked);
			}.bind(this));
		},

		onSaveButtonClicked: function(){
			if(this._wc.selection.count() === 0){
				this._helpers.win.showPrompt(
					"Please, select event categories",
					"Please, select at least one event category"
				);
			} else {
				this._wc.selection.getItems().then(function (items) {
					this._state.user.set("categories", this._.map(items, function(item){
						return item.data.id;
					}));

					WinJS.Navigation.navigate("home");
				}.bind(this));
			}
		}
	});
});