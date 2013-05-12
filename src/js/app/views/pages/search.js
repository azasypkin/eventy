define([
	"app/views/pages/base_list",
	"app/collections/events",
	"rText!templates/views/pages/search/layout.html",
	"rText!templates/views/pages/search/item.html"
],function(BaseView, EventsCollection, LayoutTemplate, ItemTemplate){
	"use strict";

	return WinJS.Class.derive(BaseView, function(_, config, proxy, state, helpers){
		BaseView.call(this,
			_,
			config,
			proxy,
			state,
			helpers,
			LayoutTemplate,
			ItemTemplate
		);

		this._onFilterSubmitted = this._onFilterSubmitted.bind(this);
		this._onDataSourceError = this._onDataSourceError.bind(this);

		this._onLocationChanged = this._onLocationChanged.bind(this);

		this._state.dispatcher.addEventListener("filter:submitted", this._onFilterSubmitted, false);

		this._state.user.addEventListener("changed", this._onLocationChanged, false);
	}, {
		_dataSource: null,
		_dataSourceErrors: [],
		_itemsLoadCompleteCallback: null,
		_itemsLoadErrorCallback: null,

		supportZoom: false,

		getItemTemplateData: function(item){
			return {
				title: item.title ? item.title.toLocaleLowerCase() : item.title,
				date: this._getStartDate(item),
				color: item.color,
				address: item.address || item.city,
				thumbnail: item.thumbnail ? item.thumbnail : "/img/no-thumbnail.png",
				category: this._config.dictionaries.categories[item.categories[0].id].name,
				distance: item.distance,
				tile: "small-tile"
			};
		},

		processItemNode: function(node, item){
			BaseView.prototype.processItemNode.call(this, node, item);

			node.title = item.title;

			return node;
		},

		createListView: function(filter){
			BaseView.prototype.createListView.apply(this, arguments);

			return this._updateDataSource(filter);
		},

		getBarsSettings: function(){
			return [{
				type: "top",
				title: this._config.getString("Header.SearchView"),
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
				.then(this.createListView.bind(this));
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

			if (this._dataSource) {
				this._dataSource.removeEventListener("error", this._onDataSourceError, false);
			}

			// create new data source to refresh list view
			this._dataSource = new EventsCollection(this._, this._config.proxies.eventbrite, this._proxy, this._prepareParameters(filter));

			this._dataSource.addEventListener("error", this._onDataSourceError, false);

			this._dataSourceErrors = [];

			// we removed all items, so selection has changed for sure :)
			this.onSelectionChanged();

			return new WinJS.Promise(function(complete, error){
				this._itemsLoadCompleteCallback = complete;
				this._itemsLoadErrorCallback = error;

				WinJS.UI.setOptions(this.wc, {
					itemDataSource: this._dataSource
				});
			}.bind(this));
		},

		_getStartDate: function(item){
			var date;

			if(item.repeats){
				if(item.next_occurrence){
					date = item.next_occurrence;
				} else {
					return this._config.getString("Proxy.TimePeriods.RepeatingEvent");
				}
			} else {
				date = item.start_date;
			}

			return date
				? this._helpers
				.moment(date, this._config.proxies.eventbrite.formats.dateWithTime)
				.format(this._config.formats.itemDate)
				: "";
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this._state.dispatcher.dispatchEvent("updateBarState", {
				type: "top",
				secondaryTitle: {
					title: ""
				}
			});

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

		_tryComplete: function(error){
			if(this._itemsLoadCompleteCallback){
				if(error){
					this._itemsLoadErrorCallback(error);
				} else {
					this._itemsLoadCompleteCallback();
				}

				this._itemsLoadCompleteCallback = null;
				this._itemsLoadErrorCallback = null;
			} else if (error) {
				return WinJS.Promise.wrapError(error);
			}
		},

		onLoadingStateChanged: function(e){
			BaseView.prototype.onLoadingStateChanged.call(this, e);

			if (e.target.winControl.loadingState === "itemsLoaded") {
				this._tryComplete();
			}
		},

		_onFilterSubmitted: function (e) {
			var userFilter = this._state.user.get("filter"),
				filter = e.detail;

			if (userFilter) {
				if (userFilter.category) {
					filter.category = userFilter.category;
				}

				filter.useCurrentLocation = userFilter.useCurrentLocation && !filter.city;
			}

			this._helpers.progress.show();
			this._updateDataSource(filter).then(function () {
				this._helpers.progress.hide();
			}.bind(this), function (e) {
				this._helpers.progress.hide();

				return WinJS.Promise.wrapError(e);
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

		_onDataSourceError: function (e) {
			this._tryComplete(e.detail);
		}
	});
});