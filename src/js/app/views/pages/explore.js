define(["app/views/pages/base", "app/proxies/eventbrite"],function(BaseView, Proxy){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this._onNextCommandInvoked = this._onNextCommandInvoked.bind(this);
		this._onOpenInBrowserCommandInvoked = this._onOpenInBrowserCommandInvoked.bind(this);
		this._onPageSelected = this._onPageSelected.bind(this);

		this._state.dispatcher.addEventListener("nextCommandInvoked", this._onNextCommandInvoked);
		this._state.dispatcher.addEventListener("openInBrowserCommandInvoked", this._onOpenInBrowserCommandInvoked);

		this._proxy = new Proxy();
	}, {

		view: "/html/views/pages/explore/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/pages/explore/item.html"
		},

		wc: null,

		bars: [{
			enabled: true,
			show: true,
			sticky: true,
			commands: ["openInBrowser", "next"]
		}],

		_emptyFrameSrc: "about:blank",
		_currentItemId: null,
		_previousPage: null,

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
				itemDataSource: itemsList.dataSource,
				itemTemplate: this._itemTemplate.bind(this)
			});
		},

		render: function (id, params) {
			// id is integer
			this._currentItemId = id - 0;
			return BaseView.prototype.render.apply(this, arguments)
				.then(function(){
					return this._createFlipView(params.items);
				}.bind(this))
				.then(function(){
					this.wc.addEventListener("pageselected", this._onPageSelected);
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

			this.wc.removeEventListener("pageselected", this._onPageSelected);

			this._state.dispatcher.removeEventListener("nextCommandInvoked", this._onNextCommandInvoked);
		},

		_onNextCommandInvoked: function(){
			this.wc.next();
		},

		_onOpenInBrowserCommandInvoked: function () {
			this.wc.itemDataSource.itemFromIndex(this.wc.currentPage).then(function (item) {
				Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(item.data.url));
			});
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
							trigger: false
						});
					}
				}

				this._previousPage = this.wc.currentPage;

				this._state.dispatcher.dispatchEvent("updateBarState", {
					type: "top",
					title: item.data.title
				});
			}.bind(this));
		}
	});
});