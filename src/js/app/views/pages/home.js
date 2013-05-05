define([
	"app/views/pages/base_list",
	"rText!templates/views/pages/home/layout.html",
	"rText!templates/views/pages/home/item.html"
],function(BaseView, LayoutTemplate, ItemTemplate){
	"use strict";

	return WinJS.Class.derive(BaseView, function(_, config, proxy, directoryProxy, state, helpers){
		BaseView.call(this, _, config, proxy, directoryProxy, state, helpers, LayoutTemplate, ItemTemplate);
	}, {

		_groups: {
			yourEvents: {
				parameters: {
					type: "all"
				},
				items: null,
				name: "Your upcoming events",
				order: 0,
				authenticatedUserRequired: true
			},
			nearby: {
				parameters: {
					within: 5,
					date: "this_month"
				},
				items: null,
				name: "Around you",
				order: 1
			},
			this_week: {
				parameters: {
					within: 100,
					date: "this_week",
					sort_by: "date"
				},
				items: null,
				name: "This week",
				order: 2
			},
			freeEvents: {
				parameters: {
					within: 30.0,
					date: "this_month",
					price: 1
				},
				items: null,
				name: "Freebies around you",
				order: 3
			}
		},

		_loadingErrors: [],
		_stillLoading: 0,
		_itemsLoadCompleteCallback: null,
		_itemsLoadErrorCallback: null,

		getBarsSettings: function () {
			return [{
				type: "top",
				title: this._config.getString("Header.HomeView"),
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

		getItemTemplateData: function(item){
			return {
				title: item.title,
				date: this._getStartDate(item),
				color: item.color,
				city: item.city,
				thumbnail: item.thumbnail ? item.thumbnail : "/img/no-thumbnail.png",
				category: this._config.dictionaries.categories[item.categories[0].id].name,
				distance: item.distance
			};
		},

		processItemNode: function(node, item){
			BaseView.prototype.processItemNode.call(this, node, item);

			node.title = item.title;

			return node;
		},

		_loadItems: function(groupKey, parameters){
			var proxy = groupKey === "freeEvents" ? this._directoryProxy : this._proxy;
			return proxy[groupKey === "yourEvents" ? "getUserUpcomingEvents" : "searchEvents"](parameters).then(function(data){
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
			return this._.extend({
				groupKey: groupKey,
				key: groupKey + "_" + item.id
			}, item);
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

		createListView: function(events){
			BaseView.prototype.createListView.apply(this, arguments);

			this._updateDataSource(events);
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

		render: function () {
			return BaseView.prototype.render.apply(this, arguments)
				.then(this._loadEvents.bind(this))
				.then(function(events){
					this.createListView(events);
				}.bind(this), function (e) {
					this.createListView([]);
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
		}
	});
});