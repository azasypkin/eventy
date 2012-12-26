define([
	"underscore",
	"config",
	"app/utils/win",
	"app/utils/template",
	"app/router",
	"app/event-dispatcher",
	"app/views/top-bar",
	"app/views/welcome",
	"app/views/categories"
], function (_, config, winUtils, templateUtils, WinRouter, dispatcher, TopBarView, WelcomePage, CategoriesPage) {
	"use strict";

	var toolBelt = {
		win: winUtils,
		template: templateUtils,
		dispatcher: dispatcher
	};

	var router = new (WinJS.Class.mix(WinRouter, {
		_page: null,
		_navigationPromise: WinJS.Promise.as(),

		_navigateTo: function(PageClass){

			this._navigationPromise.cancel();

			if (this._page) {
				this._page.unload();
			}

			this._page = new PageClass(_, config, toolBelt);

			return this._navigationPromise = this._page.render.apply(this._page, Array.prototype.slice.call(arguments, 1));
		},

		routes: {
			"welcome": "welcome",
			"categories": "categories"
		},

		welcome: function(){
			return this._navigateTo(WelcomePage);
		},

		categories: function(){
			return this._navigateTo(CategoriesPage);
		}
	}))();

	return {
		start: function(){
			return (new TopBarView(_, config, toolBelt)).render().then(function(){
				return WinJS.Navigation.navigate("welcome");
			});
		}
	};
});