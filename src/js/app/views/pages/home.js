define(["app/views/pages/base", "app/proxies/eventbrite"],function(BaseView, Proxy){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this._onSelectionChanged = this._onSelectionChanged.bind(this);
		this._onItemInvoked = this._onItemInvoked.bind(this);

		this._onExploreCommandInvoked = this._onExploreCommandInvoked.bind(this);

		this._state.dispatcher.addEventListener("exploreCommandInvoked", this._onExploreCommandInvoked);

		this._proxy = new Proxy();
	}, {

		view: "/html/views/pages/home/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/pages/home/item.html"
		},

		wc: null,

		bars: [{
			type: "top",
			title: "Home",
			enabled: true,
			show: true
		}, {
			type: "bottom",
			enabled: true,
			commands: ["editCategories"]
		}],

		_groups: {
			"nearby": {
				parameters: {
					within: 60,
					date: "this_month",
					sort_by: "city"
				},
				items: null,
				name: "Around me",
				order: 0
			},
			"this_week": {
				parameters: {
					within: 120,
					date: "this_week",
					sort_by: "date"
				},
				items: null,
				name: "This week",
				order: 1
			}
		},

		_stillLoading: 0,
		_itemsLoadCompleteCallback: null,
		_itemsLoadErrorCallback: null,

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._helpers.template.parseTemplateToDomNode(this.templates.item, item.data);
			}.bind(this));
		},

		_loadItems: function(groupKey, parameters){
			return this._proxy.searchEvents(parameters).then(function(events){
				this._groups[groupKey].items = events;
				if(--this._stillLoading === 0){
					this._onItemsReady();
				}
			}.bind(this), function(e){
				if(--this._stillLoading === 0){
					this._onItemsReady();
				}
			}.bind(this));
		},

		_createGroupItem: function(groupKey, group, item){
			return {
				groupKey: groupKey,
				key: groupKey + "_" + item.id,
				background_color: this._config.dictionaries.categories[item.categories[0].id].color,
				data: item
			};
		},

		_loadEvents: function(){
			return new WinJS.Promise(function(complete, error){
				// prepare parameters
				var parameters = {
						max: 10
					},
					userCategories = this._state.user.get("categories"),
					location = this._state.user.get("location"),
					groupKeys = Object.keys(this._groups),
					groupKey,
					i;

				this._itemsLoadCompleteCallback = complete;
				this._itemsLoadErrorCallback = error;

				if(userCategories && userCategories.length > 0){
					parameters.category = userCategories;
				}

				if(location && location.city){
					parameters.city = location.city;
				}

				this._stillLoading = groupKeys.length;

				for(i = 0; i < groupKeys.length; i++){
					groupKey = groupKeys[i];

					// load items nearby
					this._loadItems(groupKey, this._.extend({}, parameters, this._groups[groupKey].parameters));
				}
			}.bind(this));
		},

		_exploreItems: function(items){
			if(items.length > 0){
				WinJS.Navigation.navigate("explore/"+items[0].id, {
					params: {
						items: items
					}
				});
			}
		},

		_createFlipView: function(events){
			var itemsList = new WinJS.Binding.List(events),
				groupedItemsList = itemsList.createGrouped(function(item){
					return item.groupKey;
				}, function(item){
					return this._groups[item.groupKey].name;
				}.bind(this), function(leftKey, rightKey){
					return this._groups[leftKey].order - this._groups[rightKey].order;
				}.bind(this));

			this.wc = new WinJS.UI.ListView(document.getElementById("event-list-view"), {
				layout: {type: WinJS.UI.GridLayout},
				itemDataSource: groupedItemsList.dataSource,
				groupDataSource: groupedItemsList.groups.dataSource,
				itemTemplate: this._itemTemplate.bind(this)
			});
		},

		render: function () {
			return BaseView.prototype.render.apply(this, arguments)
				.then(this._loadEvents.bind(this))
				.then(this._createFlipView.bind(this))
				.then(function(){
					this.wc.addEventListener("selectionchanged", this._onSelectionChanged);
					this.wc.addEventListener("iteminvoked", this._onItemInvoked);
				}.bind(this));
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this.wc.removeEventListener("selectionchanged", this._onSelectionChanged);
			this.wc.removeEventListener("iteminvoked", this._onItemInvoked);

			this._state.dispatcher.removeEventListener("exploreCommandInvoked", this._onExploreCommandInvoked);
		},

		_onItemsReady: function(){
			// merge all groups into one array
			var groupKeys = Object.keys(this._groups),
				itemsMerged = [],
				groupKey,
				group,
				i,
				j;

			for(i = 0; i < groupKeys.length; i++){
				groupKey = groupKeys[i];
				group = this._groups[groupKey];
				if(group.items && group.items.length > 0){
					for(j = 0; j < group.items.length; j++){
						itemsMerged.push(this._createGroupItem(groupKey, group, group.items[j]));
					}
				}
			}

			this._itemsLoadCompleteCallback(itemsMerged);

			this._itemsLoadCompleteCallback = null;
			this._itemsLoadErrorCallback = null;
		},

		_onSelectionChanged: function (e) {
			this.wc.selection.getItems().then(function(items){
				var hasItemsSelected = items.length > 0,
					properties = {
						type: "bottom",
						show: hasItemsSelected,
						sticky: hasItemsSelected
					};

				properties[hasItemsSelected ? "showCommands" : "hideCommands"] = ["explore"];

				this._state.dispatcher.dispatchEvent("updateBarState", properties);
			}.bind(this));
		},

		_onItemInvoked: function (e) {
			e.detail.itemPromise.then(function (item) {
				this._exploreItems([item.data.data]);
			}.bind(this));
		},

		_onExploreCommandInvoked: function(){
			this.wc.selection.getItems().then(function(items){
				var ids = [],
					result = [],
					item,
					i;
				for(i = 0; i < items.length; i++){
					item = items[i].data.data;
					if(ids.indexOf(item.id) < 0){
						result.push(item);
						ids.push(item.id);
					}
				}
				this._exploreItems(result);
			}.bind(this));
		}
	});
});