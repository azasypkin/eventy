﻿define(["app/views/pages/base", "app/collections/events"],function(BaseView, EventsCollection){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onSelectionChanged = this._onSelectionChanged.bind(this);
		this._onItemInvoked = this._onItemInvoked.bind(this);
		this._onLoadingStateChanged = this._onLoadingStateChanged.bind(this);
		this._onFilterSubmitted = this._onFilterSubmitted.bind(this);

		this._onExploreCommandInvoked = this._onExploreCommandInvoked.bind(this);

		this._onLocationChanged = this._onLocationChanged.bind(this);

		this._state.dispatcher.addEventListener("command:explore", this._onExploreCommandInvoked, false);
		this._state.dispatcher.addEventListener("filter:submitted", this._onFilterSubmitted, false);

		this._state.user.addEventListener("changed", this._onLocationChanged, false);
	}, {

		view: "/html/views/pages/search/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/pages/search/item.html"
		},

		searchOnKeyboardInput: true,

		wc: null,

		_dataSource: null,
		_itemsLoadCompleteCallback: null,

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._helpers.template.parseTemplateToDomNode(this.templates.item, {
					title: item.data.title,
					date: this._helpers.format.date(item.data.date),
					color: item.data.color,
					city: item.data.city,
					thumbnail: item.data.thumbnail ? item.data.thumbnail : "/img/no-thumbnail.png",
					category: this._config.dictionaries.categories[item.data.categories[0].id].name,
					distance: item.data.distance
				}).then(function(node){
					node.title = item.data.title;

					return node;
				});
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

		_createListView: function(filter){
			this.wc = new WinJS.UI.ListView(document.getElementById("event-list-view"), {
				layout: { type: this.isSnapped ? WinJS.UI.ListLayout : WinJS.UI.GridLayout },
				itemTemplate: this._itemTemplate.bind(this)
			});

			this.wc.addEventListener("selectionchanged", this._onSelectionChanged);
			this.wc.addEventListener("iteminvoked", this._onItemInvoked);
			this.wc.addEventListener("loadingstatechanged", this._onLoadingStateChanged);

			return this._updateDataSource(filter);
		},

		getBarsSettings: function(){
			return [{
				type: "top",
				title: this._config.labels["Header.SearchView"],
				enabled: true,
				show: true,
				sticky: true
			}, {
				type: "bottom",
				commands: ["location", "categories", "refine"],
				enabled: true,
				show: true,
				sticky: true
			}];
		},

		render: function (query, category) {
			return BaseView.prototype.render.apply(this, arguments)
				.then(function () {
					return this._buildFilter(query, category);
				}.bind(this))
				.then(this._createListView.bind(this));
		},

		refresh: function(query, category){
			return this._updateDataSource(this._buildFilter(query, category));
		},

		_buildFilter: function(query, category){
			var filter = this._state.user.get("filter") || {},
				location = this._state.user.get("location");

			if(location && !filter.city){
				filter.useCurrentLocation = true;
			}

			if(query){
				filter.query = query;
			}

			if(category){
				filter.category = category;
			} else {
				delete filter.category;
			}

			if(!filter.date){
				filter.date = "this_week";
			}

			if(!filter.within){
				filter.within = "10";
			}

			if(!filter.withinType){
				filter.withinType = "M";
			}

			return filter;
		},

		_updateDataSource: function(filter){

			this._helpers.noData.hide();

			this._updateSecondaryTitle(filter);

			// update filter with the latest values
			this._state.dispatcher.dispatchEvent("updateBarState", {
				type: "bottom",
				filter: filter
			});

			// update user state filter
			this._state.user.set("filter", this._.extend(this._state.user.get("filter") || {}, filter));

			// create new data source to refresh list view
			this._dataSource = new EventsCollection(this._, this._config.proxies.eventbrite, this._proxy, this._prepareParameters(filter));

			// we removed all items, so selection has changed for sure :)
			this._onSelectionChanged();

			return new WinJS.Promise(function(complete){
				this._itemsLoadCompleteCallback = complete;

				WinJS.UI.setOptions(this.wc, {
					itemDataSource: this._dataSource
				});
			}.bind(this));
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			if (this.wc) {
				this.wc.removeEventListener("selectionchanged", this._onSelectionChanged);
				this.wc.removeEventListener("iteminvoked", this._onItemInvoked);
			}

			this._state.dispatcher.dispatchEvent("updateBarState", {
				type: "top",
				secondaryTitle: {
					title: ""
				}
			});

			this._helpers.noData.hide();

			this._state.dispatcher.removeEventListener("command:explore", this._onExploreCommandInvoked, false);
			this._state.dispatcher.removeEventListener("filter:submitted", this._onFilterSubmitted, false);

			this._state.user.removeEventListener("changed", this._onLocationChanged, false);
		},

		_updateSecondaryTitle: function(filter){
			var titleFragments = [],
				timePeriodName;

			if(filter.query){
				titleFragments.push("'" + filter.query + "'");
			}

			if(filter.category){
				titleFragments.push(this._config.dictionaries.categories[filter.category].name);
			}

			if(filter.city){
				titleFragments.push(filter.city);
			}

			if(filter.date && filter.date !== "all"){
				titleFragments.push(this._config.dictionaries.timePeriods[filter.date].name);
			}

			this._state.dispatcher.dispatchEvent("updateBarState", {
				type: "top",
				secondaryTitle: {
					title: "<strong>Criteria:</strong> " + titleFragments.join(', '),
					color: "#fff"
				}
			});
		},

		_prepareParameters: function(filter){
			var userCategories = this._state.user.get("categories"),
				location = this._state.user.get("location"),
				parameters = {
					sort_by: "date"
				};

			if(filter.city){
				parameters.city = filter.city;
			} else if(location){
				parameters.latitude = location.lat;
				parameters.longitude = location.lon;
			}

			if(filter.within){
				parameters.within = filter.within;
			}

			if(filter.withinType){
				parameters.within_unit = filter.withinType;
			}

			if(filter.date){
				parameters.date = filter.date;
			}

			if (filter.query) {
				parameters.keywords = filter.query;
			}

			if(filter.category){
				parameters.category = filter.category;
			} else if(userCategories && userCategories.length > 0){
				parameters.category = userCategories;
			}

			return parameters;
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
				this._exploreItems([item.data]);
			}.bind(this));
		},

		_onLoadingStateChanged: function(e){
			if (this._itemsLoadCompleteCallback && e.target.winControl.loadingState === "itemsLoaded") {
				e.target.winControl.itemDataSource.getCount().then(function(count){
					if(count === 0){
						this._helpers.noData.show();
					}
				}.bind(this));
				this._itemsLoadCompleteCallback();
				this._itemsLoadCompleteCallback = null;
			}
		},

		_onExploreCommandInvoked: function(){
			this.wc.selection.getItems().then(function(items){
				var ids = [],
					result = [],
					item,
					i;
				for(i = 0; i < items.length; i++){
					item = items[i].data;
					if(ids.indexOf(item.id) < 0){
						result.push(item);
						ids.push(item.id);
					}
				}
				this._exploreItems(result);
			}.bind(this));
		},

		_onFilterSubmitted: function (e) {
			var userFilter = this._state.user.get("filter"),
				filter = e.detail;

			if(userFilter && userFilter.category){
				filter.category = userFilter.category;
			}

			this._helpers.progress.show();
			this._updateDataSource(filter).then(function () {
				this._helpers.progress.hide();
			}.bind(this));
		},

		_onLocationChanged: function(e){
			var filter = this._state.user.get("filter");
			if(e.detail && e.detail.key === "location" && filter){
				filter.city = null;
				filter.useCurrentLocation = true;

				this._state.user.set("filter", filter);
			}
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