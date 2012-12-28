define(function (require) {
	"use strict";

	var _ = require("underscore"),
		Backbone = require("backbone"),
		SitesC = require("collections/sites"),
		storage = require("libs/storage"),
		api = require("libs/api"),
		ms = require("libs/ms"),
		date = require("libs/date"),
		str = require("libs/string"),
		hash = require("libs/hash"),
		StumbleError = require("libs/errors/stumble_error");

	var maxPageSize = window.suConfig("numItemsPerLoad"),

		LikesC = SitesC.extend(),
		GroupM = Backbone.Model.extend({
			idAttribute: "key",
			initialize: function (data) {
				var parsedGroupDate = date.parseDate(data.display_name);

				this.set("firstItemIndexHint", data.first_index);
				this.set("data", {
					title: parsedGroupDate
						? str.format(groupTitleTemplate, {
							monthName: date.getMonthNameByIndex(parsedGroupDate.getMonth()),
							year: parsedGroupDate.getFullYear()
						})
						: data.display_name,
					linkTitle: null
				});
				this.set("groupSize", data.count);
			}
		}),
		GroupsC = Backbone.Collection.extend({
			model: GroupM
		}),

		makeDataSource = function (dataAdapter) {
			return WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
				this._baseDataSourceConstructor(dataAdapter);
			});
		},
		maxCount = function () {
			return parseInt(storage.get("user").likes_count, 10);
		},
		// [AZ]: Not sure whether we should use hash.likes here,
		// is it possible that groups will change during one session (ex. using app at the last night of the month)?
		// maybe we need to use another cache key here
		getUserLikesGroups = function () {
			return api.getUserLikesGroups().then(function (data) {
				return new GroupsC(data.groups.values).toJSON();
			});

		},
		fetchGroupRange = function (groups, requestToken) {

			var totalCount = groups.length,
				isRequestedByKey = typeof requestToken === "string",
				requestIndex = isRequestedByKey ? -1 : requestToken,
				group,
				items = [],
				i;

			for (i = 0; i < totalCount; i++) {
				group = groups[i];

				if(isRequestedByKey && group.key === requestToken){
					requestIndex = i;
				}

				items.push(group);
			}

			if (requestIndex >= totalCount || requestIndex < 0) {
				return ms.doesNotExist(requestIndex);
			}

			var result = {
				totalCount: totalCount,
				offset: requestIndex,
				items: items,
				absoluteIndex: requestIndex
			};

			ms.silentSuccess(ms.tryToString(result));

			return result;
		},

		groupTitleTemplate = "{monthName} {year}",
		DataAdapter,
		GroupDataAdapter;

	DataAdapter = {
		remove: function (){
			this.count--;
			return WinJS.Promise.wrap();
		},

		count: -1,

		itemsFromIndex: function (requestIndex) {
			ms.silentSuccess("DataAdapter.itemsFromIndex: " + requestIndex);

			// To optimize using of cache on memcache/redis we should use the same pages while requesting data.
			// Page is equal to "maxPageSize" and we should determine which page will contain requested item
			var requestedPageIndex = Math.floor(requestIndex / maxPageSize),
				fetchStartIndex = requestedPageIndex * maxPageSize;

			return api.getUserLikes(fetchStartIndex, maxPageSize).then(function (data) {
				var result = {
					totalCount: data.total,
					offset: requestIndex - fetchStartIndex,
					items: new LikesC(data.items).toJSON(),
					absoluteIndex: requestIndex
				};

				this.count = data.total;

				ms.silentSuccess(ms.tryToString(result));

				return result;
			}.bind(this), function () {
				return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.noResponse));
			});
		},

		getCount: function () {
			if(this.count < 0){
				this.count = maxCount();
			}
			return WinJS.Promise.wrap(this.count);
		}
	};

	//We don't use paging for groups as API doesn't support it, but probably for ~50 groups we will need this
	GroupDataAdapter = {
		itemsFromIndex: function (requestIndex) {
			ms.silentSuccess("GroupDataAdapter.itemsFromIndex: " + requestIndex);

			return getUserLikesGroups().then(function (groups) {
				return fetchGroupRange(groups, requestIndex);
			}.bind(this));
		},

		itemsFromKey: function (key) {
			ms.silentSuccess("GroupDataAdapter.itemsFromKey: " + key);

			return getUserLikesGroups().then(function (groups) {
				return fetchGroupRange(groups, key);
			}.bind(this));
		},

		getCount: function () {
			return getUserLikesGroups().then(function (groups) {
				return groups.length;
			});
		}
	};

	return {
		DataSource: makeDataSource(DataAdapter),
		GroupDataSource: makeDataSource(GroupDataAdapter)
	};
});