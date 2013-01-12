define([
	"underscore",
	"config",

	"app/utils/datetime",

	"app/core/errors/base_error",

	"app/models/event",
	"app/models/category",
	"app/models/user-details"
], function (_, globalConfig, dateUtils, BaseError, Event, Category, UserDetails) {
	"use strict";

	return WinJS.Class.define(function(options){
		options = options || {};
		this._config = globalConfig.proxies.eventbrite;
		this._url = this._config.url;
		this._user= options.user;
		this._useFakeData = options.useFakeData !== undefined ? options.useFakeData : false;
		this._reverseCategoriesIndex = this._buildCategoryReverseIndex();
		this._helpers = options.helpers;
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
				parameters = params || {},
				token = this._user.get("token"),
				i,
				key,
				keys;

			if(token){
				parameters.access_token = token;
			} else {
				parameters.app_key = this._config.appKey;
			}

			keys = Object.keys(this._prepareParameters(parameters));

			for(i = 0; i < keys.length; i++){
				key = keys[i];
				url += (i === 0 ? "?" : "&") + key + "=" + parameters[key];
			}

			return url;
		},

		_prepareParameters: function (parameters) {
			if (parameters.date) {
				parameters.date = this._prepareDateRange(parameters.date);
			}

			if(parameters.category && parameters.category instanceof Array && parameters.category.length > 0){
				parameters.category = _.map(parameters.category, function(category){
					return this._config.categories[category];
				}.bind(this));
			}

			if(!parameters.city && !parameters.longitude){
				if(parameters.within){
					delete parameters.within;
				}

				if(parameters.within_unit){
					delete parameters.within_unit;
				}
			}

			return parameters;
		},

		//[WORKAROUND]: Workaround for Eventbrite bugs with next week and next month
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
			if (this._useFakeData) {
				return this._getFake("events");
			} else {
				return WinJS.xhr({
					url: this._buildUrl("event_search", params),
					responseType: this._config.dataType,
					headers: this._getHeaders(),
					timeout: this._config.timeout
				}).then(function(data){
					data = JSON.parse(data.responseText);
					var result = [];
					// first element is the summary
					if (data && !data.error && data.events && data.events.length > 1) {
						for (var i = 1; i < data.events.length; i++) {
							result.push(this._convertToEvent(data.events[i].event, params));
						}
					} else if(data.error){
						return WinJS.Promise.wrapError(
							new BaseError("SearchEvents request failed.", BaseError.Codes.API_FAILED, data.error)
						);
					}
					return {
						total: result.length > 0 ? data.events[0].summary.total_items : 0,
						items: result
					};
				}.bind(this), function(e){
					return WinJS.Promise.wrapError(
						new BaseError("SearchEvents request failed.", BaseError.Codes.XHR_FAILED, e)
					);
				});
			}
		},

		getUserUpcomingEvents: function (params) {
			params = {
				type: params.type
			};
			if (this._useFakeData) {
				return this._getFake("userUpcomingEvents");
			} else {
				return WinJS.xhr({
					url: this._buildUrl("user_list_tickets", params),
					responseType: this._config.dataType,
					headers: this._getHeaders(),
					timeout: this._config.timeout
				}).then(function(data){
					data = JSON.parse(data.responseText);
					var result = [],
						ids = [],
						ticket,
						order,
						i,
						j;

					// first element is the summary
					if (data && !data.error && data.user_tickets && data.user_tickets.length > 1) {
						for (i = 1; i < data.user_tickets.length; i++) {
							ticket = data.user_tickets[i];
							for(j = 0; j < ticket.orders.length; j++){
								order = ticket.orders[j].order;
								if(ids.indexOf(order.event.id) < 0){
									result.push(this._convertToEvent(order.event, params));
								}
							}
						}
					} else if(data.error){
						return WinJS.Promise.wrapError(
							new BaseError("SearchEvents request failed.", BaseError.Codes.API_FAILED, data.error)
						);
					}
					return {
						total: result.length,
						items: result
					};
				}.bind(this), function(e){
						return WinJS.Promise.wrapError(
							new BaseError("SearchEvents request failed.", BaseError.Codes.XHR_FAILED, e)
						);
					});
			}
		},

		getUserDetails: function () {
			if (this._useFakeData) {
				return this._getFake("userDetails");
			} else {
				return WinJS.xhr({
					url: this._buildUrl("user_get"),
					responseType: this._config.dataType,
					headers: this._getHeaders(),
					timeout: this._config.timeout
				}).then(function(data){
					try{
						data = JSON.parse(data.responseText);
					} catch(e){}

					if (data && !data.error && data.user) {
						return new UserDetails({
							id: data.user.user_id,
							email: data.user.email
						});
					} else {
						return WinJS.Promise.wrapError(
							new BaseError("GetUserDetails request failed.", BaseError.Codes.API_FAILED, data && data.error)
						);
					}
				}.bind(this), function(e){
					return WinJS.Promise.wrapError(
						new BaseError("GetUserDetails request failed.", BaseError.Codes.XHR_FAILED, e)
					);
				});
			}
		},

		_getHeaders: function(){
			var headers = {
					"Content-Type": "application/json; charset=utf-8"
				},
				token = this._user.get("token");

			if(token){
				headers.Authorization = "Bearer " + token;
			}

			return headers;
		},

		_getFake: function (name) {
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
			var event = new Event({
					id: jsonEvent.id - 0,
					title: jsonEvent.title,
					url: jsonEvent.url,
					date: this._getDate(jsonEvent),
					thumbnail: jsonEvent.logo,
					categories: [],
					description: jsonEvent.description,
					city: jsonEvent.venue ? jsonEvent.venue.city : "",
					venue: jsonEvent.venue ? jsonEvent.venue.name : "",
					country: jsonEvent.venue ? jsonEvent.venue.country : "",
					distance: jsonEvent.distance ? jsonEvent.distance : ""
			});

			// temporal fix - sanitizing event description

			if (event.description && event.description.indexOf("<") >= 0) {
				try{
					event.description = this._helpers.win.parseStringToHtmlDocument(event.description).body.innerText;
				} catch(e){

				}
			}

			var popularity = jsonEvent.capacity - 0;
			// to avoid 0-s
			event.popularity = popularity + 1;

			if (jsonEvent.category) {
				var categories = jsonEvent.category.trim().split(',');
				if (categories.length > 0) {
					_.each(categories, function (categoryId) {
						var mappedCategory = this._reverseCategoriesIndex[categoryId],
							category = {
								id: mappedCategory,
								requestedBy: request.category && request.category.indexOf(mappedCategory) >= 0
							};
						// category by which item was requested should be in the beginning
						if (category.requestedBy) {
							event.categories.unshift(category);
						} else {
							event.categories.push(category);
						}
						event.categories.push();
					}.bind(this));
				}
			} else {
				event.categories = [{
					id: "other",
					requestedBy: false
				}];
			}

			event.color = globalConfig.dictionaries.categories[event.categories[0].id].color;

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
				repeats: jsonEvent.repeats && jsonEvent.repeats.toLowerCase() === "yes" ? true : false,
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