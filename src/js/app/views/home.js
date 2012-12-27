define(["app/views/base", "app/proxies/eventbrite"],function(BaseView, Proxy){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this._proxy = new Proxy();
	}, {

		view: "/html/views/home/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/home/item.html"
		},

		_wc: null,

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._helpers.template.parseTemplateToDomNode(this.templates.item, item.data);
			}.bind(this));
		},

		_loadEvents: function(location){
			// prepare parameters
			var parameters = {
					date: "this_week",
					max: 50
				},
				userCategories = this._state.user.get("categories");

			if(userCategories && userCategories.length > 0){
				parameters.category = userCategories;
			}

			if(location && location.city){
				parameters.city = location.city;
			}

			return this._proxy.searchEvents(parameters);
		},

		_createListView: function(events){
			var data = [],
				event,
				i;

			for(i = 0; i < events.length; i++){
				event = events[i];

				data.push({
					id: event.id,
					background_color: this._config.dictionaries.categories[event.categories[0].id].color,
					data: event
				});
			}

			this._wc = new WinJS.UI.ListView(document.getElementById("event-list-view"), {
				layout: {type: WinJS.UI.GridLayout},
				itemDataSource: (new WinJS.Binding.List(data)).dataSource,
				itemTemplate: this._itemTemplate.bind(this)
			});
		},

		render: function () {
			this._helpers.dispatcher.dispatchEvent("updateBarState", {
				type: "top",
				title: "Home",
				enabled: true,
				show: true
			});
			this._helpers.dispatcher.dispatchEvent("updateBarState", {
				type: "bottom",
				enabled: true
			});
			return BaseView.prototype.render.apply(this, arguments)
				.then(function(){
					return new WinJS.Promise(function(complete){
						return this._helpers.location.getLocation().then(complete, function(){
							complete();
						});
					}.bind(this));
				}.bind(this))
				.then(this._loadEvents.bind(this))
				.then(this._createListView.bind(this));
		}
	});
});