define(["underscore", "config", "app/router", "app/views/welcome"], function (_, config, WinRouter, WelcomePage) {
	"use strict";

	var router = new (WinJS.Class.mix(WinRouter, {
		_page: null,
		_navigationPromise: WinJS.Promise.as(),

		_navigateTo: function(PageClass){

			this._navigationPromise.cancel();

			if (this._page) {
				this._page.unload();
			}

			this._page = new PageClass(config);

			return this._navigationPromise = this._page.render.apply(this._page, Array.prototype.slice.call(arguments, 1));
		},

		routes: {
			"welcome": "welcome"
		},

		welcome: function(){
			return this._navigateTo(WelcomePage);
		}
	}))();

	return {
		start: function(){
			return WinJS.Navigation.navigate("welcome");
		}
	};
});