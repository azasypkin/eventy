define(["app/views/pages/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onSaveButtonClicked = this._onSaveButtonClicked.bind(this);
	}, {

		view: "/html/views/pages/categories/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/pages/categories/item.html"
		},

		eventPrefix: "categories",

		wc: null,

		_isFirstTimeSelection: false,

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._helpers.template.parseTemplateToDomNode(this.templates.item, item.data);
			}.bind(this));
		},

		_createListView: function(){
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
			}

			data.sort(function(a, b) {
				if (a.data.name < b.data.name) {
					return -1;
				} else if(a.data.name > b.data.name){
					return 1;
				} else {
					return 0;
				}
			});

			for(i = 0; i < data.length; i++){
				if(currentUserCategories.indexOf(data[i].id) >= 0){
					selection.push(i);
				}
			}

			this.wc = new WinJS.UI.ListView(document.getElementById("category-list-view"), {
				layout: {
					type: this.isSnapped ? WinJS.UI.ListLayout : WinJS.UI.GridLayout
				},
				itemDataSource: (new WinJS.Binding.List(data)).dataSource,
				itemTemplate: this._itemTemplate.bind(this),
				tapBehavior: "toggleSelect"
			});

			this.wc.selection.set(selection);
		},

		getBarsSettings: function(){
			return [{
				type: "top",
				title: this._config.labels["Header.CategoriesView"],
				enabled: true,
				show: true
			}, {
				type: "bottom",
				enabled: false
			}];
		},

		render: function(isFirstTimeSelection){

			if(isFirstTimeSelection === true){
				this._isFirstTimeSelection = isFirstTimeSelection;
			}
			return BaseView.prototype.render.apply(this, arguments)
				.then(this._createListView.bind(this)).then(function(){
					document.getElementById("btn-save-categories").addEventListener(
						"click",
						this._onSaveButtonClicked,
						false
					);
			}.bind(this));
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			var btnSaveCategories = document.getElementById("btn-save-categories");
			if(btnSaveCategories){
				btnSaveCategories.removeEventListener(
					"click",
					this._onSaveButtonClicked,
					false
				);
			}
		},

		_onSaveButtonClicked: function(){
			if(this.wc.selection.count() === 0){
				this._helpers.win.showPrompt(
					"Please, select event categories",
					"Please, select at least one event category"
				);
			} else {
				this.wc.selection.getItems().then(function (items) {

					this._state.user.set("categories", this._.map(items, function(item){
						return item.data.id;
					}));

					this.raiseEvent("saved");

					if(this._isFirstTimeSelection){
						WinJS.Navigation.navigate("home", {
							keepHistory: false
						});
					} else {
						WinJS.Navigation.back(1);
					}

				}.bind(this));
			}
		},

		_onSnapped: function () {
			BaseView.prototype._onSnapped.apply(this, arguments);

			WinJS.UI.setOptions(this.wc, {
				layout: {
					type: WinJS.UI.ListLayout
				}
			});

		},

		_onUnSnapped: function () {
			BaseView.prototype._onUnSnapped.apply(this, arguments);

			WinJS.UI.setOptions(this.wc, {
				layout: {
					type: WinJS.UI.GridLayout
				}
			});
		}
	});
});