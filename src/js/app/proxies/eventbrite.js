define([
	"underscore",
	"config",

	"app/core/errors/base_error",
	"app/core/cache/cache",

	"app/models/event",
	"app/models/user-details"
], function (_, globalConfig, BaseError, Cache, Event, UserDetails) {
	"use strict";

	return WinJS.Class.define(function(options){
		options = options || {};
		this._config = globalConfig.proxies.eventbrite;
		this._user= options.user;
		this._reverseCategoriesIndex = this._buildCategoryReverseIndex();
		this._helpers = options.helpers;

		this._cacheManager = {
			enabled: true,

			generateKey: function(str){
				return this._helpers.string.hash(str);
			}.bind(this),

			get: function(key){
				return options.cache.get(key);
			}.bind(this),

			add: function(key, value){
				if(value && !value.error){
					options.cache.add(key, value, Cache.LifeTimeStrategies.ExpireByTimeout(this._config.cacheTimeout));
				}
			}.bind(this)
		};
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

		_prepareParameters: function (parameters) {
			var requestParameters = parameters || {},
				token = this._user.get("token");

			if(token){
				requestParameters.access_token = token;
			} else {
				requestParameters.app_key = this._config.appKey;
			}

			if (requestParameters.date) {
				requestParameters.date = this._prepareDateRange(requestParameters.date);
			}

			if(requestParameters.category && requestParameters.category instanceof Array && requestParameters.category.length > 0){
				requestParameters.category = _.map(requestParameters.category, function(category){
					return this._config.categories[category];
				}.bind(this));
			}

			if(!requestParameters.city && !requestParameters.longitude){
				if(requestParameters.within){
					delete requestParameters.within;
				}

				if(requestParameters.within_unit){
					delete requestParameters.within_unit;
				}
			}

			return requestParameters;
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

				return this._helpers.moment(firstRangeDay).format(this._config.formats.date)
					+ " "
					+ this._helpers.moment(lastRangeDay).format(this._config.formats.date);
			}
			return this._config.timePeriods[dateRange];
		},

		genericRequest: function (options) {
			options.parameters = this._prepareParameters(options.parameters);

			return this._helpers.win.ensureIsOnline()
				.then(function () {
				return this._helpers.win.xhr({
					cache: this._cacheManager,
					url: options.path ? this._config.url + options.path : this._config.url,
					method: options.method,
					parameters: options.parameters,
					responseType: this._config.dataType,
					headers: this._getHeaders(),
					timeout: this._config.timeout
				}).then(function(data){
					var jsonResponse = JSON.parse(data);

					if(jsonResponse.error){
						if (jsonResponse.error.error_type === "Not Found") {
							return null;
						} else {
							return WinJS.Promise.wrapError(
								new BaseError(options.path + " request failed.", BaseError.Codes.API_FAILED, jsonResponse.error)
							);
						}
					}

					return jsonResponse;
				});
			}.bind(this))
				.then(null, function (e) {
				if(e.originalError && e.originalError.responseText){
					try {
						return WinJS.Promise.wrapError(
							new BaseError(
								options.path + " request failed.",
								BaseError.Codes.API_FAILED,
								JSON.parse(e.originalError.responseText))
						);
					} catch(error){
					}
				}
				return WinJS.Promise.wrapError(e);
			}.bind(this));
		},

		getEvent: function(params){
			return this.genericRequest({
				path: "event_get",
				parameters: params
			}).then(function (data) {
				if(data && data.event){
					return this._convertToEvent(data.event, params);
				}
				return null;
			}.bind(this));
		},

		searchEvents: function (params) {
			return this.genericRequest({
				path: "event_search",
				parameters: params
			}).then(function (data) {
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
		},

		searchFreeEvents: function (params) {
			return this.genericRequest({
				path: "event_search",
				parameters: params
			}).then(function (data) {
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
		},

		getUserUpcomingEvents: function (params) {
			return this.genericRequest({
				path: "user_list_tickets",
				parameters: params
			}).then(function (data) {
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
		},

		getUserDetails: function () {
			return this.genericRequest({
				path: "user_get"
			}).then(function(data){
				if (data && data.user) {
					return new UserDetails({
						id: data.user.user_id,
						email: data.user.email
					});
				}

				return null;
			}.bind(this));
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

		_convertToEvent: function (jsonEvent, request) {
			var event = new Event({
					id: jsonEvent.id - 0,
					title: jsonEvent.title,
					url: jsonEvent.url,

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
					repeats: jsonEvent.repeats && jsonEvent.repeats.toLowerCase() === "yes",

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

			event.next_occurrence = this._getNextOccurrence(event, jsonEvent);

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
							price: isNaN(ticket.ticket.price) ? "-" : ticket.ticket.price + " " + ticket.ticket.currency,
							end_date: ticket.ticket.end_date
						});
					}
				});
			}

			event.color = globalConfig.dictionaries.categories[event.categories[0].id].color;

			return event;
		},

		// date is the complex value consisted of actual local date, timezone and repeats
		_getNextOccurrence: function (event, jsonEvent) {
			var repeatSchedule,
				scheduleType;

			if(event.repeats){

				// here we have 3 parts [type of repeat(ex. daily)]-[unknown number]-[last repeat date]
				repeatSchedule = jsonEvent.repeat_schedule.split('-');

				scheduleType = repeatSchedule[0];

				// currently we support just daily repeats
				if (scheduleType === 'daily') {
					return this._helpers.moment().format(this._config.formats.date);
				}
			}

			return "";
		}
	});
});