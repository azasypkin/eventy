define(["app/views/pages/base", "app/proxies/eventbrite"],function(BaseView, Proxy){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onNextCommandInvoked = this._onNextCommandInvoked.bind(this);
		this._onOpenInBrowserCommandInvoked = this._onOpenInBrowserCommandInvoked.bind(this);

		this._onPageSelected = this._onPageSelected.bind(this);
		this._onPageVisibilityChanged = this._onPageVisibilityChanged.bind(this);


		this._state.dispatcher.addEventListener("command:next", this._onNextCommandInvoked, false);
		this._state.dispatcher.addEventListener("command:openInBrowser", this._onOpenInBrowserCommandInvoked, false);

		this._proxy = new Proxy();
	}, {

		view: "/html/views/pages/explore/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/pages/explore/item.html"
		},

		wc: null,

		_emptyFrameSrc: "about:blank",
		_currentItemId: null,
		_previousPage: null,

		getBarsSettings: function () {
			return [{
				type: "top",
				enabled: true,
				show: true,
				sticky: true,
				title: this._config.labels["Header.ExploreView"]
			}, {
				type: "bottom",
				enabled: true,
				show: true,
				sticky: true,
				commands: ["search", "globalSeparator", "openInBrowser", "next"]
			}];
		},

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._setupFrame(item.data.id, item.data.url);
			}.bind(this));
		},

		_setupFrame: function(id, src){
			var frame = document.createElement("iframe");

			frame.id = id;

			frame.src = src ? src : this._emptyFrameSrc;

			//frame.addEventListener("load", this.onFrameLoaded);
			//frame.addEventListener("error", this.onFrameError);

			return frame;
		},

		_createFlipView: function(events){
			var itemsList = new WinJS.Binding.List(events);

			this.wc = new WinJS.UI.FlipView(document.getElementById("explore-flip-view"), {
				itemTemplate: this._itemTemplate.bind(this)
			});

			this.wc.addEventListener("pageselected", this._onPageSelected, false);
			this.wc.addEventListener("pagevisibilitychanged", this._onPageVisibilityChanged, false);

			WinJS.UI.setOptions(this.wc, {
				itemDataSource: itemsList.dataSource
			});
		},

		render: function (id, params) {
			// id is integer
			this._currentItemId = id - 0;
			return BaseView.prototype.render.apply(this, arguments)	.then(function(){
				return this._createFlipView(params.items);
			}.bind(this));
		},

		refresh: function (id) {
			this._currentItemId = id - 0;
			if(this.wc.currentPage > 0){
				return this.wc.itemDataSource.itemFromIndex(this.wc.currentPage - 1).then(function (item) {
					if(item.data.id === this._currentItemId){
						return this.wc.previous();
					}
					return WinJS.Promise.wrap();
				}.bind(this));
			}
			return WinJS.Promise.wrap();
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			if (this.wc) {
				this.wc.removeEventListener("pageselected", this._onPageSelected, false);
			}

			this._state.dispatcher.dispatchEvent("updateBarState", {
				type: "top",
				secondaryTitle: {
					title: ""
				}
			});

			this._state.dispatcher.removeEventListener("command:next", this._onNextCommandInvoked, false);
			this._state.dispatcher.removeEventListener("command:openInBrowser", this._onOpenInBrowserCommandInvoked, false);
		},

		_onNextCommandInvoked: function(){
			this.wc.next();
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

				this.wc.count().then(function (count) {
					var properties = {
						type: "bottom"
					};

					properties[this.wc.currentPage !== count - 1 ? "enableCommands" : "disableCommands"] = ["next"];

					this._state.dispatcher.dispatchEvent("updateBarState", properties);

				}.bind(this));

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
							trigger: false
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
		}
	});
});