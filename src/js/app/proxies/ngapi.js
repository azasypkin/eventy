﻿define([
	"config",

	"app/core/errors/base_error",
	"app/core/cache/cache",

	"app/models/event"
], function (globalConfig, BaseError, Cache, Event) {
	"use strict";

	return WinJS.Class.define(function(options){
		options = options || {};

		this._ = options._;
		this._config = globalConfig.proxies.ngapi;
		this._helpers = options.helpers;
		this._user= options.user;

		this._cacheManager = {
			enabled: true,

			generateKey: function(str){
				return this._helpers.string.hash(str);
			}.bind(this),

			get: function(key){
				return options.cache.get(key);
			}.bind(this),

			add: function(key, value){
				options.cache.add(key, value, Cache.LifeTimeStrategies.ExpireByTimeout(this._config.cacheTimeout));
			}.bind(this)
		};
	},{

		_prepareParameters: function (parameters) {
			var requestParameters = {},
				token = this._user.get("token");

			if(token){
				requestParameters.access_token = token;
			} else {
				requestParameters.api_key = this._config.appKey;
			}

			if(parameters.longitude){
				requestParameters.lng = requestParameters.slng = parameters.longitude;
			}

			if(parameters.latitude){
				requestParameters.lat = requestParameters.slat = parameters.latitude;
			}

			return requestParameters;
		},

		genericRequest: function (options) {
			return this._helpers.win.ensureIsOnline()
				.then(function () {
					return this._helpers.win.xhr({
						cache: this._cacheManager,
						url: this._config.url,
						method: options.method,
						parameters:this._prepareParameters(options.parameters),
						responseType: this._config.dataType,
						timeout: this._config.timeout
					}).then(function(data){
						return JSON.parse(data);
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

		searchRelevantEvents: function (params) {
			return this.genericRequest({
				parameters: params
			}).then(function (data) {
				var result = [];

				if(data && data.meta && data.meta.nb_events_found > 0){
					data.events.forEach(function(eventJson){
						result.push(this._convertToEvent(eventJson, params));
					}.bind(this));
					//result.push(this._convertToEvent(data.events[0], params));
				}

				return {
					total: result.length > 0 ? data.meta.nb_events_found : 0,
					items: result
				};
			}.bind(this));
		},

		_convertToEvent: function (jsonEvent, request) {
			var event = new Event({
					isPartial: true,
					id: jsonEvent.id,
					title: jsonEvent.title ? this._.escape(jsonEvent.title) : "",
					url: "http://www.eventbrite.com/event/" + jsonEvent.id,

					thumbnail: jsonEvent.event_image_url,

					repeats: jsonEvent.is_repeating,
					start_date: jsonEvent.start_date,
					end_date: jsonEvent.end_date,
					next_occurrence: jsonEvent.next_occurrence,
					timezone: jsonEvent.time_zone,

					description: jsonEvent.description ? window.toStaticHTML(jsonEvent.description) : "",
					city: jsonEvent.venue_city ? this._.escape(jsonEvent.venue_city) : "",
					venue: jsonEvent.venue_name ? this._.escape(jsonEvent.venue_name) : "",

					address: jsonEvent.venue_address ? this._.escape(jsonEvent.venue_address) : "",

					latitude: jsonEvent.latitude,
					longitude: jsonEvent.longitude,

					categories: []
			});

			if (jsonEvent.category && jsonEvent.category.length > 0) {
				jsonEvent.category.forEach(function(categoryId){
					var mappedCategory = this._config.reverse_categories[
							categoryId.replace(/\s/g, "").replace(/\//g, "").toLowerCase()
						],
						category;

					if(mappedCategory){
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
					}
				}.bind(this));
			}

			if(event.categories.length === 0){
				event.categories.push({
					id: "other",
					requestedBy: false
				});
			}

			event.color = globalConfig.dictionaries.categories[event.categories[0].id].color;

			return event;
		}
	});
});