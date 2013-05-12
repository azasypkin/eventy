define(["app/core/cache/cache"], function (Cache) {
	"use strict";

	return WinJS.Class.define(function(options){
		options.mapping.forEach(function(entry, index){
			var proxyName = "_proxy_" +  index,
				proxy = new entry.type({
					_: options._,
					config: options.config,
					user: options.user,
					helpers: options.helpers,
					cache: new Cache()
				});

			this[proxyName] = proxy;

			entry.methods.forEach(function(method){
				this[method] = function(){
					return proxy[method].apply(proxy, arguments);
				};
			}.bind(this));

		}.bind(this));

	},
	{});
});