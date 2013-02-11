define([
	"app/views/pages/base",
	"rText!templates/views/pages/explore/layout.html",
	"rText!templates/views/pages/explore/item.html"
],function(BaseView, LayoutTemplate, ItemTemplate){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this.templates = {
			layout: this._helpers.template.htmlStringToTemplate(LayoutTemplate),
			item: this._helpers.template.htmlStringToTemplate(ItemTemplate)
		};

		this._onOpenInBrowserCommandInvoked = this._onOpenInBrowserCommandInvoked.bind(this);

		this._onPageSelected = this._onPageSelected.bind(this);
		this._onPageVisibilityChanged = this._onPageVisibilityChanged.bind(this);

		this._state.dispatcher.addEventListener("command:openInBrowser", this._onOpenInBrowserCommandInvoked, false);
	}, {

		container: document.getElementById("content"),

		wc: null,

		_currentItemId: null,
		_previousPage: null,
		_source: null,

		isShareSupported: function(){
			return true;
		},

		getDataToShare: function(){
			return this.wc.itemDataSource.itemFromIndex(this.wc.currentPage).then(function (item) {
				return {
					url: item.data.url,
					title: item.data.title,
					description: item.data.url,
					thumbnail: item.data.thumbnail
				};
			});
		},

		getBarsSettings: function () {
			return [{
				type: "top",
				enabled: true,
				show: true,
				sticky: true,
				title: this._config.getString("Header.ExploreView")
			}, {
				type: "bottom",
				enabled: true,
				show: true,
				sticky: true,
				commands: ["search", "globalSeparator", "openInBrowser"]
			}];
		},

		_renderTemplate: function(item){
			var parsedStartDate = new Date(this._helpers.date.getDateFromFormat(item.start_date, "yyyy-MM-dd HH:mm:ss")),
				parsedEndDate = new Date(this._helpers.date.getDateFromFormat(item.end_date, "yyyy-MM-dd HH:mm:ss")),
				venueCoordinate = item.latitude + ", " + item.longitude,
				mapImageUrl = "http://maps.googleapis.com/maps/api/staticmap?sensor=false"
					+ "&CENTER=" + venueCoordinate
					+ "&markers=" + "color:red|" + venueCoordinate
					+ "&zoom=15"
					+ "&size=270x270"
					+ "&key=" + this._config.googleAPIKey,
				mapUrl = "http://maps.google.com/?q=" + venueCoordinate;

			return this._helpers.template.parseTemplateToDomNode(this.templates.item, {
				data: item,
				formattedStartDate: this._helpers.date.formatDate(parsedStartDate, "EE, NNN d, yyyy h:mm a"),
				formattedEndDate: this._helpers.date.formatDate(parsedEndDate, "EE, NNN d, yyyy h:mm a"),
				mapImageUrl: mapImageUrl,
				mapUrl: mapUrl
			});
		},

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				var itemDataPromise;

				if(item.data.isPartial){
					itemDataPromise = this._proxy.getEvent({
						id: item.data.id,
						display: "custom_header,custom_footer"
					}).then(function(event){
						item.data = event;
						return event;
					});
				} else {
					itemDataPromise = WinJS.Promise.wrap(item.data);
				}

				return itemDataPromise.then(this._renderTemplate.bind(this)).then(function (node) {
					var styleNodes = node.querySelectorAll("style"),
						styleNode,
						i;

					if (styleNodes && styleNodes.length > 0) {
						for (i = 0; i < styleNodes.length; i++) {
							styleNode = styleNodes[i];

							styleNode.parentNode.removeChild(styleNode);
						}
					}

					return node;
				}.bind(this));
			}.bind(this));
		},

		_createFlipView: function(events){
			var itemsList = new WinJS.Binding.List(events),
				flipViewContainer = document.getElementById("explore-flip-view"),
				currentPage = 0,
				event,
				i;

			this._source = events;

			for(i=0; i < this._source.length; i++){
				event = this._source[i];

				if(event.id === this._currentItemId){
					currentPage = i;
					break;
				}
			}

			this.wc = new WinJS.UI.FlipView(flipViewContainer, {
				itemTemplate: this._itemTemplate.bind(this)
			});

			this.wc.addEventListener("pageselected", this._onPageSelected, false);
			this.wc.addEventListener("pagevisibilitychanged", this._onPageVisibilityChanged, false);

			WinJS.UI.setOptions(this.wc, {
				itemDataSource: itemsList.dataSource,
				currentPage: currentPage
			});
		},

		render: function (id, params) {
			// id is integer
			this._currentItemId = id - 0;
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				return this._createFlipView(params.items);
			}.bind(this)).then(function(){
				return this._helpers.win.ensureIsOnline();
			}.bind(this));
		},

		refresh: function (id) {
			this._currentItemId = id - 0;
			if(this.wc.currentPage > 0){
				return this.wc.itemDataSource.itemFromIndex(this.wc.currentPage - 1).then(function (item) {
					if(item.data.id === this._currentItemId){
						return this.wc.previous();
					}
					return this._helpers.win.ensureIsOnline();
				}.bind(this));
			}
			return this._helpers.win.ensureIsOnline();
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			if (this.wc) {
				this.wc.removeEventListener("pageselected", this._onPageSelected, false);
				this.wc.removeEventListener("pagevisibilitychanged", this._onPageVisibilityChanged, false);
			}

			this._state.dispatcher.dispatchEvent("updateBarState", {
				type: "top",
				secondaryTitle: {
					title: ""
				}
			});

			this._state.dispatcher.removeEventListener("command:openInBrowser", this._onOpenInBrowserCommandInvoked, false);
		},

		_onOpenInBrowserCommandInvoked: function () {
			this.wc.itemDataSource.itemFromIndex(this.wc.currentPage).then(function (item) {
				this._helpers.win.launchURI(item.data.url);
			}.bind(this));
		},

		_onPageSelected: function(){
			this.wc.itemDataSource.itemFromIndex(this.wc.currentPage).then(function (item) {
				var backStackLength = WinJS.Navigation.history.backStack.length,
					newUrl;

				if(this._currentItemId !== item.data.id){
					this._currentItemId = item.data.id;

					newUrl = "explore/" + this._currentItemId;

					//check back case
					if(this._previousPage
						&& this._previousPage > this.wc.currentPage
						&& backStackLength > 0 && WinJS.Navigation.history.backStack[backStackLength - 1].location === newUrl){
						WinJS.Navigation.back(1);
					} else {
						// update URL in history
						WinJS.Navigation.navigate(newUrl, {
							trigger: false,
							params: {
								items: this._source
							}
						});
					}
				}

				this._previousPage = this.wc.currentPage;

			}.bind(this));
		},

		_onPageVisibilityChanged: function(e){
			var isVisible = e.detail.visible;
			if (isVisible) {
				this.wc.itemDataSource.itemFromIndex(this.wc.currentPage).then(function (item) {
					this._state.dispatcher.dispatchEvent("updateBarState", {
						type: "top",
						secondaryTitle: {
							title: item.data.title,
							color: this._config.dictionaries.categories[item.data.categories[0].id].color
						}
					});
				}.bind(this));
			}
			return this._helpers.win.ensureIsOnline();
		}
	});
});