define([
	"app/views/pages/base_list",
	"rText!templates/views/pages/home/layout.html",
	"rText!templates/views/pages/home/item.html",
	"rText!templates/views/pages/home/semantic-item.html"
],function(BaseView, LayoutTemplate, ItemTemplate, SemanticItemTemplate){
	"use strict";

	return WinJS.Class.derive(BaseView, function(_, config, proxy, state, helpers){
		BaseView.call(this,
			_,
			config,
			proxy,
			state,
			helpers,
			LayoutTemplate,
			ItemTemplate,
			SemanticItemTemplate
		);
	}, {

		_groups: {
			featuredEvents: {
				name: " Featured",
				items: null,
				order: 0,
				tile: "large-tile"
			},
			relevantEvents: {
				items: null,
				name: " Relevant",
				order: 1,
				method: "searchRelevantEvents"
			},
			yourEvents: {
				parameters: {
					type: "all"
				},
				items: null,
				name: " Attending",
				order: 2,
				authenticatedUserRequired: true,
				method: "getUserUpcomingEvents"
			},
			nearby: {
				parameters: {
					within: 5,
					date: "this_month"
				},
				items: null,
				name: " Around you",
				order: 3,
				method: "searchEvents"
			},
			this_week: {
				parameters: {
					within: 100,
					date: "this_week",
					sort_by: "date"
				},
				items: null,
				name: " This week",
				order: 4,
				method: "searchEvents"
			},
			freeEvents: {
				parameters: {
					within: 30.0,
					date: "this_month",
					price: 1
				},
				items: null,
				name: " Freebies",
				order: 5,
				method: "searchDirectoryEvents"
			}
		},

		_loadingErrors: [],
		_stillLoading: 0,
		_itemsLoadCompleteCallback: null,
		_itemsLoadErrorCallback: null,

		supportZoom: true,

		szwc: null,
		zwc: null,

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
				title: item.title ? item.title.toLocaleLowerCase() : item.title,
				date: this._getStartDate(item),
				color: item.color,
				address: item.address || item.city,
				thumbnail: item.thumbnail ? item.thumbnail : "/img/no-thumbnail.png",
				category: this._config.dictionaries.categories[item.categories[0].id].name,
				distance: item.distance,
				tile: item.tile
			};
		},

		getSemanticItemTemplateData: function(item){
			return {
				name: item
			};
		},

		processItemNode: function(node, item){
			BaseView.prototype.processItemNode.call(this, node, item);

			node.title = item.title;

			return node;
		},

		_loadItems: function(groupKey, parameters){
			return this._proxy[this._groups[groupKey].method](parameters).then(function(data){
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
				key: groupKey + "_" + item.id,
				tile: group.tile
			}, item);
		},

		_loadEvents: function(){
			return new WinJS.Promise(function(complete, error){
				// prepare parameters
				var parameters = {
						max: 15,
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

					if(group.method && (!group.authenticatedUserRequired ||
						this._state.user.isAuthenticated())){
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

			WinJS.UI.setOptions(this.zwc, {
				itemDataSource: bindingList.groups.dataSource
			});
		},

		createListView: function(events){
			BaseView.prototype.createListView.apply(this, arguments);
			this._updateDataSource(events);
		},

		getGroupInfo: function(){
			return {
				enableCellSpanning: true,
				cellWidth: 230,
				cellHeight: 230
			};
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

			if(this._groups.relevantEvents.items && this._groups.relevantEvents.items.length > 0){
				this._groups.featuredEvents.items = this._groups.relevantEvents.items.splice(
					Math.floor(Math.random() * this._groups.relevantEvents.items.length),
					1
				);
			}

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