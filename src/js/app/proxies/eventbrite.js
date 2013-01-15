define([
	"underscore",
	"config",

	"app/utils/datetime",

	"app/core/errors/base_error",
	"app/core/cache/cache",

	"app/models/event",
	"app/models/category",
	"app/models/user-details"
], function (_, globalConfig, dateUtils, BaseError, Cache, Event, Category, UserDetails) {
	"use strict";

	return WinJS.Class.define(function(options){
		options = options || {};
		this._config = globalConfig.proxies.eventbrite;
		this._url = this._config.url;
		this._user= options.user;
		this._useFakeData = options.useFakeData !== undefined ? options.useFakeData : false;
		this._reverseCategoriesIndex = this._buildCategoryReverseIndex();
		this._helpers = options.helpers;
		this._cache = options.cache;
		this._cacheTimeout = this._config.cacheTimeout;
	},{

		_getUrlHash: function(url){
			var hash = 0,
				charCode,
				i;
			if (url.length === 0) {
				return hash;
			}
			for (i = 0; i < url.length; i++) {
				charCode = url.charCodeAt(i);
				hash = ((hash<<5)-hash)+charCode;
				// Convert to 32bit integer
				hash = hash & hash;
			}
			return hash;
		},

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

		genericRequest: function (type, params) {
			var url = this._buildUrl(type, params),
				key = "request_" + this._getUrlHash(url),
				cachedValue = this._cache.get(key);

			return cachedValue
				? WinJS.Promise.wrap(cachedValue)
				: this._helpers.win.ensureIsOnline().then(function () {
					return WinJS.xhr({
						url: url,
						responseType: this._config.dataType,
						headers: this._getHeaders(),
						timeout: this._config.timeout
					}).then(function(data){
						var jsonResponse = JSON.parse(data.responseText);

						if(jsonResponse.error){
							if (jsonResponse.error.error_type === "Not Found") {
								return null;
							} else {
								return WinJS.Promise.wrapError(
									new BaseError(type + " request failed.", BaseError.Codes.API_FAILED, jsonResponse.error)
								);
							}
						} else {
							this._cache.add(key, jsonResponse, Cache.LifeTimeStrategies.ExpireByTimeout(this._cacheTimeout));

							return jsonResponse;
						}
					}.bind(this), function (e) {
						return WinJS.Promise.wrapError(
							new BaseError("XHR request failed.", BaseError.Codes.XHR_FAILED, e)
						);
					});
				}.bind(this));
		},

		getEvent: function(params){
			return this.genericRequest("event_get", params).then(function (data) {
				if(data && data.event){
					return this._convertToEvent(data.event, params);
				}
				return null;
			}.bind(this));
		},

		searchEvents: function (params) {
			if (this._useFakeData) {
				return this._getFake("events");
			} else {
				return this.genericRequest("event_search", params).then(function (data) {
					var result = [];

					if(data && data.events && data.events.length > 1){
						for (var i = 1; i < data.events.length; i++) {
							result.push(this._convertToEvent(data.events[i].event, params));
						}
					}

					return {
						total: result.length > 0 ? data.events[0].summary.total_items : 0,
						items: result
					};
				}.bind(this));
			}
		},

		getUserUpcomingEvents: function (params) {
			if (this._useFakeData) {
				return this._getFake("userUpcomingEvents");
			} else {
				return this.genericRequest("user_list_tickets", params).then(function (data) {
					var result = [],
						ids = [],
						ticket,
						order,
						event,
						i,
						j;

					if(data && data.user_tickets && data.user_tickets.length > 1){
						for (i = 1; i < data.user_tickets.length; i++) {
							ticket = data.user_tickets[i];
							for (j = 0; j < ticket.orders.length; j++) {
								order = ticket.orders[j].order;
								if (ids.indexOf(order.event.id) < 0) {
									event = this._convertToEvent(order.event, params);

									event.isPartial = true;

									result.push(event);
								}
							}
						}
					}

					return {
						total: result.length,
						items: result
					};
				}.bind(this));
			}
		},

		getUserDetails: function () {
			if (this._useFakeData) {
				return this._getFake("userDetails");
			} else {
				return this.genericRequest("user_get").then(function(data){
					if (data && data.user) {
						return new UserDetails({
							id: data.user.user_id,
							email: data.user.email
						});
					}

					return null;
				}.bind(this));
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
					description: jsonEvent.description ? window.toStaticHTML(jsonEvent.description) : "",
					city: jsonEvent.venue ? jsonEvent.venue.city : "",
					region: jsonEvent.venue ? jsonEvent.venue.region : "",
					venue: jsonEvent.venue ? jsonEvent.venue.name : "",
					country: jsonEvent.venue ? jsonEvent.venue.country : "",
					distance: jsonEvent.distance ? jsonEvent.distance : "",
					address: jsonEvent.venue ? jsonEvent.venue.address : "",
					postal_code: jsonEvent.venue ? jsonEvent.venue.postal_code : "",
					latitude: jsonEvent.venue ? jsonEvent.venue.latitude : "",
					longitude: jsonEvent.venue ? jsonEvent.venue.longitude : "",
					custom_header: jsonEvent.custom_header ? window.toStaticHTML(jsonEvent.custom_header) : "",
					custom_footer: jsonEvent.custom_footer ? window.toStaticHTML(jsonEvent.custom_footer) : "",
					organizer_name: jsonEvent.organizer ? jsonEvent.organizer.name : "",
					organizer_url: jsonEvent.organizer ? jsonEvent.organizer.url : "",

					start_date: jsonEvent.start_date,
					end_date: jsonEvent.end_date,
					timezone: jsonEvent.timezone,

					styles: {
						background_color: jsonEvent.background_color ? "#" + jsonEvent.background_color : "",
						text_color: jsonEvent.text_color ? "#" + jsonEvent.text_color : "",
						box_background_color: jsonEvent.box_background_color ? "#" + jsonEvent.box_background_color : "",
						box_text_color: jsonEvent.box_text_color ? "#" + jsonEvent.box_text_color : "",
						box_header_background_color: jsonEvent.box_header_background_color ? "#" + jsonEvent.box_header_background_color : "",
						box_header_text_color: jsonEvent.box_header_text_color ? "#" + jsonEvent.box_header_text_color : "",
						box_border_color: jsonEvent.box_border_color ? "#" + jsonEvent.box_border_color : ""
					}
			});

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

			event.tickets = [];

			if(jsonEvent.tickets){
				jsonEvent.tickets.forEach(function (ticket) {
					if (ticket.ticket.visible === "true") {
						event.tickets.push({
							name: ticket.ticket.name,
							description: ticket.ticket.description,
							price: ticket.ticket.price + " " + ticket.ticket.currency,
							end_date: ticket.ticket.end_date
						});
					}
				});
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
		_getDate: function (jsonEvent) {
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

				// currently we support just daily repeats
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