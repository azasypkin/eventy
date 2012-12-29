define(["app/views/pages/base", "app/proxies/eventbrite"],function(BaseView, Proxy){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.prototype.constructor.apply(this, arguments);

		this._onNextCommandInvoked = this._onNextCommandInvoked.bind(this);
		this._onOpenInBrowserCommandInvoked = this._onOpenInBrowserCommandInvoked.bind(this);

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

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._setupFrame(item.data.data.id, item.data.data.url);
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
			this.bars[0].title = params.items[0].data.title;
			return BaseView.prototype.render.apply(this, arguments)
				.then(function(){
					return this._createFlipView(params.items);
				}.bind(this));
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this._state.dispatcher.removeEventListener("nextCommandInvoked", this._onNextCommandInvoked);
		},

		_onNextCommandInvoked: function(){
			this.wc.next();
		},

		_onOpenInBrowserCommandInvoked: function () {
			this.wc.itemDataSource.itemFromIndex(this.wc.currentPage).then(function (item) {
				Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(item.data.data.url));
			});
		}
	});
});