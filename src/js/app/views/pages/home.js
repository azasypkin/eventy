define(["app/views/pages/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onSelectionChanged = this._onSelectionChanged.bind(this);
		this._onItemInvoked = this._onItemInvoked.bind(this);
		this._onLoadingStateChanged = this._onLoadingStateChanged.bind(this);

		this._onExploreCommandInvoked = this._onExploreCommandInvoked.bind(this);

		this._state.dispatcher.addEventListener("command:explore", this._onExploreCommandInvoked);
	}, {

		view: "/html/views/pages/home/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/pages/home/item.html"
		},

		searchOnKeyboardInput: true,

		wc: null,

		_groups: {
			"yourEvents": {
				parameters: {
					type: "all"
				},
				items: null,
				name: "Your upcoming events",
				order: 0,
				authenticatedUserRequired: true
			},
			"nearby": {
				parameters: {
					within: 5,
					date: "this_month"
				},
				items: null,
				name: "Around me",
				order: 1
			},
			"this_week": {
				parameters: {
					within: 100,
					date: "this_week",
					sort_by: "date"
				},
				items: null,
				name: "This week",
				order: 2
			}
		},

		_loadingErrors: [],
		_stillLoading: 0,
		_itemsLoadCompleteCallback: null,
		_itemsLoadErrorCallback: null,

		getBarsSettings: function () {
			return [{
				type: "top",
				title: this._config.labels["Header.HomeView"],
				enabled: true,
				show: true,
				sticky: true
			}, {
				type: "bottom",
				commands: ["location", "search", "categories"],
				enabled: true,
				show: true,
				sticky: true
			}];
		},

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._helpers.template.parseTemplateToDomNode(this.templates.item, {
					title: item.data.data.title,
					date: this._helpers.format.date(item.data.data.date),
					color: item.data.data.color,
					city: item.data.data.city,
					thumbnail: item.data.data.thumbnail ? item.data.data.thumbnail : "/img/no-thumbnail.png",
					category: this._config.dictionaries.categories[item.data.data.categories[0].id].name,
					distance: item.data.data.distance
				}).then(function(node){
					node.title = item.data.data.title;

					return node;
				});
			}.bind(this));
		},

		_loadItems: function(groupKey, parameters){
			return this._proxy[groupKey === "yourEvents" ? "getUserUpcomingEvents" : "searchEvents"](parameters).then(function(data){
				this._groups[groupKey].items = data.items;
				if(--this._stillLoading === 0){
					this._onItemsReady();
				}
			}.bind(this), function (e) {
				this._loadingErrors.push(e);

				if(--this._stillLoading === 0){
					this._onItemsReady();
				}
			}.bind(this));
		},

		_createGroupItem: function(groupKey, group, item){
			return {
				groupKey: groupKey,
				key: groupKey + "_" + item.id,
				data: item
			};
		},

		_loadEvents: function(){
			return new WinJS.Promise(function(complete, error){
				// prepare parameters
				var parameters = {
						max: 10,
						display: "custom_header,custom_footer"
					},
					userCategories = this._state.user.get("categories"),
					location = this._state.user.get("location"),
					groupKeys = Object.keys(this._groups),
					requests = [],
					groupKey,
					group,
					i;

				this._itemsLoadCompleteCallback = complete;
				this._itemsLoadErrorCallback = error;

				if(userCategories && userCategories.length > 0){
					parameters.category = userCategories;
				}

				if(location){
					parameters.latitude = location.lat;
					parameters.longitude = location.lon;
				}

				this._stillLoading = 0;
				this._loadingErrors = [];

				for(i = 0; i < groupKeys.length; i++){
					groupKey = groupKeys[i];
					group = this._groups[groupKey];

					group.items = null;

					if(!group.authenticatedUserRequired || this._state.user.isAuthenticated()){
						requests.push({
							key: groupKey,
							parameters: this._.extend({}, parameters, this._groups[groupKey].parameters)
						});
					}
				}

				// this inefficient trick here cause we want to know real value for this._stillLoading before we issue any request
				// to avoid race condition
				if (requests.length > 0) {
					this._stillLoading = requests.length;

					requests.forEach(function (request) {
						this._loadItems(request.key, request.parameters);
					}.bind(this));

				} else {
					this._onItemsReady();
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

		_getBindingList: function(events){
			return (new WinJS.Binding.List(events)).createGrouped(function(item){
					return item.groupKey;
				}, function(item){
					return this._groups[item.groupKey].name;
				}.bind(this), function(leftKey, rightKey){
					return this._groups[leftKey].order - this._groups[rightKey].order;
				}.bind(this));
		},

		_updateDataSource: function (events) {
			var bindingList = this._getBindingList(events);

			this._helpers.noData.hide();

			this._state.contracts.liveTiles.populate(events);

			WinJS.UI.setOptions(this.wc, {
				itemDataSource: bindingList.dataSource,
				groupDataSource: bindingList.groups.dataSource
			});
		},

		_createListView: function(events){
			this.wc = new WinJS.UI.ListView(document.getElementById("event-list-view"), {
				layout: { type: this.isSnapped ? WinJS.UI.ListLayout : WinJS.UI.GridLayout },
				itemTemplate: this._itemTemplate.bind(this)
			});

			this.wc.addEventListener("selectionchanged", this._onSelectionChanged, false);
			this.wc.addEventListener("iteminvoked", this._onItemInvoked, false);
			this.wc.addEventListener("loadingstatechanged", this._onLoadingStateChanged, false);

			this._updateDataSource(events);
		},

		render: function () {
			return BaseView.prototype.render.apply(this, arguments)
				.then(this._loadEvents.bind(this))
				.then(function(events){
					this._createListView(events);
				}.bind(this), function (e) {
					this._createListView([]);
					return WinJS.Promise.wrapError(e);
				}.bind(this));
		},

		refresh: function(){
			return this._loadEvents().then(function(events){
				this._updateDataSource(events);
			}.bind(this), function (e) {
				this._updateDataSource([]);
				return WinJS.Promise.wrapError(e);
			}.bind(this));
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			if (this.wc) {
				this.wc.removeEventListener("selectionchanged", this._onSelectionChanged, false);
				this.wc.removeEventListener("iteminvoked", this._onItemInvoked, false);
				this.wc.removeEventListener("loadingstatechanged", this._onLoadingStateChanged, false);
			}

			this._helpers.noData.hide();

			this._state.dispatcher.removeEventListener("command:explore", this._onExploreCommandInvoked);
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

			// we notify user that something went wrong only if all requests are failed
			if(this._loadingErrors.length > 0 && itemsMerged.length === 0){
				this._itemsLoadErrorCallback(this._loadingErrors[0]);
			} else {
				this._itemsLoadCompleteCallback(itemsMerged);
			}

			this._itemsLoadCompleteCallback = null;
			this._itemsLoadErrorCallback = null;
		},

		_onSelectionChanged: function () {
			this.wc.selection.getItems().then(function(items){
				var hasItemsSelected = items.length > 0,
					properties = {
						type: "bottom"
					};

				properties[hasItemsSelected ? "showCommands" : "hideCommands"] = ["globalSeparator", "explore"];

				if(hasItemsSelected){
					properties.show = hasItemsSelected;
				}

				this._state.dispatcher.dispatchEvent("updateBarState", properties);
			}.bind(this));
		},

		_onItemInvoked: function (e) {
			e.detail.itemPromise.then(function (item) {
				this._exploreItems([item.data.data]);
			}.bind(this));
		},

		_onLoadingStateChanged: function(e){
			if (e.target.winControl.loadingState === "itemsLoaded") {
				e.target.winControl.itemDataSource.getCount().then(function(count){
					if(count === 0){
						this._helpers.noData.show();
					}
				}.bind(this));
			}
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
		},

		_onSnapped: function () {
			BaseView.prototype._onSnapped.apply(this, arguments);

			if(this.wc){
				WinJS.UI.setOptions(this.wc, {
					layout: {
						type: WinJS.UI.ListLayout
					}
				});
			}
		},

		_onUnSnapped: function () {
			BaseView.prototype._onUnSnapped.apply(this, arguments);
			if(this.wc){
				WinJS.UI.setOptions(this.wc, {
					layout: {
						type: WinJS.UI.GridLayout
					}
				});
			}
		}
	});
});