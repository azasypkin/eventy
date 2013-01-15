define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	var TimeoutExpirationStrategy = WinJS.Class.define(function(timeout){
		this._timeout = timeout;
	}, {
		setup: function(key, expirationNotificationHandler){
			this._isExpired = false;

			window.setTimeout(function(){
				this._isExpired = true;
				if(expirationNotificationHandler){
					expirationNotificationHandler(key);
				}
			}.bind(this), this._timeout);
		},

		isExpired: function(){
			return this._isExpired;
		}
	});

	var Cache = WinJS.Class.define(function (isCacheEnabled) {
		this._internalCache = {};
		this._isCacheEnabled = typeof isCacheEnabled === "boolean" ? isCacheEnabled : true;

		this._itemExpired = this._itemExpired.bind(this);
	}, {
		add: function(key, value, lifeTimeStrategy){
			var cacheItem,
				expireHandler = function(key){
					this.remove();
				}.bind(this);

			this._validateKey(key);

			this._validateValue(value);

			if(!lifeTimeStrategy){
				lifeTimeStrategy = Cache.LifeTimeStrategies.AlwaysExpire();
			} else {
				this._validateLifeTimeStrategy(lifeTimeStrategy);
			}

			if(this.isEnabled()){
				cacheItem = {
					value: value,
					lifeTimeStrategy: lifeTimeStrategy
				};

				if(typeof lifeTimeStrategy.setup === "function"){
					lifeTimeStrategy.setup(key, this._itemExpired);
				}

				this._internalCache[key] = cacheItem;
			}
		},

		remove: function(key){

			this._validateKey(key);

			if(this._internalCache.hasOwnProperty(key)){
				delete this._internalCache[key];
			}
		},

		get: function(key){
			var cacheItem;

			this._validateKey(key);

			if(this._internalCache.hasOwnProperty(key)){
				cacheItem = this._internalCache[key];

				if(!cacheItem.lifeTimeStrategy.isExpired(key, cacheItem)){
					return cacheItem.value;
				} else {
					this.remove(key);
					cacheItem = null;
				}
			}

			return null;
		},

		isEnabled: function(){
			return this._isCacheEnabled;
		},

		_validateKey: function(key){
			if(typeof key !== "string"){
				throw new BaseError(
					"Cache: 'key' parameter should be non-empty string value!",
					BaseError.Codes.INTERNAL
				);
			}
		},

		_validateValue: function(value){
			if(value === null && typeof value === "undefined"){
				throw new BaseError(
					"Cache: 'value' parameter shouldn't be null or undefined, to remove value from cache use 'remove' method instead!",
					BaseError.Codes.INTERNAL
				);
			}
		},

		_validateLifeTimeStrategy: function(lifeTimeStrategy){
			if(lifeTimeStrategy && typeof lifeTimeStrategy.isExpired !== "function"){
				throw new BaseError(
					"Cache: 'lifeTimeStrategy' parameter should be an object with 'isExpired' member function that returns boolean!",
					BaseError.Codes.INTERNAL
				);
			}
		},

		_itemExpired: function(key){
			this.remove(key);
		}
	}, {
		LifeTimeStrategies: {
			NeverExpire: function(){
				return {
					isExpired: function(){
						return false;
					}
				};
			},
			AlwaysExpire: function(){
				return {
					isExpired: function(){
						return true;
					}
				};
			},
			ExpireByTimeout: function(timeout){
				return new TimeoutExpirationStrategy(timeout);
			},
			ExpireToken: function(tokenProvider){
				return {
					setup: function(key, cacheItem){
						cacheItem._expireToken = tokenProvider(key, cacheItem);
					},
					isExpired: function(key, cacheItem){
						return cacheItem._expireToken !== tokenProvider(key, cacheItem);
					}
				};
			}
		}
	});

	return Cache;
});
