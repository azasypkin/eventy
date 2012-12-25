define([
	"underscore",
	"config",
	"app/utils/datetime",
	"app/models/event",
	"app/models/category"
], function (_, globalConfig, dateUtils, Event, Category) {
	"use strict";

	return WinJS.Class.define(function(options){
		options = options || {};
		this._config = globalConfig.proxies.eventbrite;
		this._url = options.url || this._config.url;
		this._appKey = options.appKey || this._config.appKey;
		this._useFakeData = options.useFakeData !== undefined ? options.useFakeData : false;
		this._reverseCategoriesIndex = this._buildCategoryReverseIndex();
	},{
		_buildCategoryReverseIndex: function(){
			var categoryKeys = Object.keys(this._config.categories),
				reverseCategoriesIndex = {},
				key,
				value;
			for(var i = 0; i < categoryKeys.length; i++){
				key = categoryKeys[i];
				value = this._config.categories[key];
				reverseCategoriesIndex[value] = key;
			}
			return reverseCategoriesIndex;
		},

		_buildUrl: function (path, params) {
			var url = path ? this._url + path : this._url,
				i,
				key,
				keys;

			if(params){
				keys = Object.keys(this._prepareParameters(params));

				for(i = 0; i < keys.length; i++){
					key = keys[i];
					url += (i === 0 ? "?" : "&") + key + "=" + params[key];
				}
			}

			return url;
		},

		_prepareParameters: function (parameters) {
			if (parameters.date) {
				parameters.date = this._prepareDateRange(parameters.date);
			}
			if(!parameters.app_key){
				parameters.app_key = this._appKey;
			}
			if(parameters.categories && parameters.categories.length > 0){
				parameters.categories = _.map(parameters.categories, function(category){
					return this._config.categories[category];
				});
			}
			return parameters;
		},

		//[WORKAROUND]: Workaround for EventBrite bugs with next week and next month
		_prepareDateRange: function (dateRange) {
			if (dateRange === 'next_week' || dateRange === 'next_month') {
				// we consider current client time and timezone as base time
				var currentDate = new Date(),
					firstRangeDay,
					lastRangeDay;
				if (dateRange === 'next_week') {
					// 86400000 - ms in a day
					var dayOfWeek = currentDate.getDay();
					// change sunday with monday and vice versa
					if (dayOfWeek === 0) {
						dayOfWeek = 6;
					} else if (dayOfWeek === 6) {
						dayOfWeek = 0;
					}
					firstRangeDay = new Date(currentDate.getTime() + (7 - dayOfWeek) * 86400000);
					lastRangeDay = new Date(firstRangeDay.getTime() + 6 * 86400000);
				} else {
					firstRangeDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
					// 0 day means last of the previous month
					lastRangeDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
				}

				return dateUtils.formatDate(firstRangeDay, "yyyy-MM-dd") + " " + dateUtils.formatDate(lastRangeDay, "yyyy-MM-dd");
			}
			return this._config.timePeriods[dateRange];
		},

		getBestInCategory: function (params) {
			if (this._useFakeData) {
				return this._getFake("events");
			} else {
				return WinJS.xhr({
					url: this._buildUrl(""),
					dataType: this._config.dataType,
					contentType: 'application/json; charset=utf-8',
					data: this._prepareParameters(_.extend({ max: 1	}, params)),
					timeout: this._config.timeout}).then(function(data){
						var result = null;

						if (data && !data.error && data.events) {
							result = this._convertToCategory(data.events, params);
						}

						return result;
				}.bind(this));
			}
		},

		searchEvents: function (params) {
			var self = this;

			if (this._useFakeData) {
				return this._getFake("events");
			} else {
				return WinJS.xhr({
					url: this._buildUrl(null, params),
					responseType: this._config.dataType,
					headers: {"Content-Type": "application/json; charset=utf-8"},
					timeout: this._config.timeout
				}).then(function(data){
					data = JSON.parse(data.responseText);
					var result = [];
					// first element is the summary
					if (data && !data.error && data.events && data.events.length > 1) {
						for (var i = 1; i < data.events.length; i++) {
							result.push(self._convertToEvent(data.events[i].event, params));
						}
					}
					return result;
				});
			}
		},

		getFake: function (name) {
			var self = this;

			return new WinJS.Promise(function(complete){
				require([
					"app/data"
				], function (data) {
					var result = [];

					if(name.toLowerCase() === "events"){
						_.each(data.events.events.event, function () {
							result.push(self._convertToEvent(this));
						});
					}

					complete(result);
				});
			});
		},

		_convertToEvent: function (jsonEvent, request) {
			var _this = this,
				event = new Event({
					id: jsonEvent.id,
					title: jsonEvent.title,
					url: jsonEvent.url,
					date: this._getDate(jsonEvent),
					categories: [],
					description: jsonEvent.description,
					city: jsonEvent.venue ? jsonEvent.venue.city : "",
					venue: jsonEvent.venue ? jsonEvent.venue.name : "",
					country: jsonEvent.venue ? jsonEvent.venue.country : ""
				});

			var popularity = jsonEvent.capacity - 0;
			// to avoid 0-s
			event.popularity = popularity + 1;

			if (jsonEvent.category) {
				var categories = jsonEvent.category.trim().split(',');
				if (categories.length > 0) {
					_.each(categories, function () {
						var mappedCategory = _this._reverseCategoriesIndex[this];
						event.categories.push({
							id: mappedCategory,
							requestedBy: request.category === mappedCategory
						});
					});
				}
			}

			return event;
		},

		_convertToCategory: function (jsonCategory, request) {

			// jsonCategory is an array where first element is summary

			var category = new Category({
				id: request.category,
				eventsInCategory: jsonCategory[0].summary.total_items - 0
			});

			if (jsonCategory.length > 1 && jsonCategory[1].event) {
				//[AZ]: We consider only first the most popular event
				category.popularEvent = this._convertToEvent(jsonCategory[1].event, request);
			}

			return category;
		},

		// date is the complex value consisted of actual local date, timezone and repeats
		_getDate: function (jsonEvent, requestedPeriod) {
			// here we need timezone to determine current date in the specified time zone
			var result = {
				offset: this._config.timezones[jsonEvent.timezone],
				repeats: jsonEvent.repeats && jsonEvent.repeats.toLowerCase() == "yes" ? true : false,
				date: dateUtils.getUtcDateFromFormat(jsonEvent.start_date, "yyyy-MM-dd HH:mm:ss", this._config.timezones[jsonEvent.timezone])
			};

			if (result.repeats) {
				// here we have 3 parts [type of repeat(ex. daily)]-[unknown number]-[last repeat date]
				var repeatSchedule = jsonEvent.repeat_schedule.split('-');

				var scheduleType = repeatSchedule[0];

				// currently we support just dayly repeats
				if (scheduleType === 'daily') {
					var today = new Date();
					result.date = dateUtils.utcDate(today, -today.getTimezoneOffset());
				} else {
					result.date = "repeats";
				}
			}
			return result;
		},

		_getTimeZoneOffset: function (timeZoneName) {
			return this._config.timezones[timeZoneName];
		}
	});
});