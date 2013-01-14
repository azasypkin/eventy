define(["app/views/pages/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onNextCommandInvoked = this._onNextCommandInvoked.bind(this);
		this._onOpenInBrowserCommandInvoked = this._onOpenInBrowserCommandInvoked.bind(this);

		this._onPageSelected = this._onPageSelected.bind(this);
		this._onPageVisibilityChanged = this._onPageVisibilityChanged.bind(this);


		this._state.dispatcher.addEventListener("command:next", this._onNextCommandInvoked, false);
		this._state.dispatcher.addEventListener("command:openInBrowser", this._onOpenInBrowserCommandInvoked, false);
	}, {

		view: "/html/views/pages/explore/main.html",
		container: document.getElementById("content"),
		templates: {
			item: "/html/views/pages/explore/item.html",
			frame: "/html/views/pages/explore/iframe.html"
		},

		wc: null,

		_emptyFrameSrc: "about:blank",
		_sandboxFrameSrc: "ms-appx:///html/views/pages/explore/iframe.html",
		_currentItemId: null,
		_previousPage: null,

		isShareSupported: function(){
			return true;
		},

		getDataToShare: function(){
			return this.wc.itemDataSource.itemFromIndex(this.wc.currentPage).then(function (item) {
				return {
					url: item.data.url,
					title: item.data.title,
					description: item.data.description,
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
				var parsedStartDate = new Date(this._helpers.date.getDateFromFormat(item.data.start_date, "yyyy-MM-dd HH:mm:ss")),
					parsedEndDate = new Date(this._helpers.date.getDateFromFormat(item.data.end_date, "yyyy-MM-dd HH:mm:ss"));

				return this._helpers.template.parseTemplateToDomNode(this.templates.item, {
					data: item.data,
					formattedStartDate: this._helpers.date.formatDate(parsedStartDate, "EE, NNN d, yyyy h:mm a"),
					formattedEndDate: this._helpers.date.formatDate(parsedEndDate, "EE, NNN d, yyyy h:mm a")
				}).then(function (node) {
					var styleNodes = node.querySelectorAll("style"),
						mapContainer = node.querySelector(".map"),
						frame = document.createElement("iframe"),
						styleNode,
						i;

					if (styleNodes && styleNodes.length > 0) {
						for (i = 0; i < styleNodes.length; i++) {
							styleNode = styleNodes[i];

							styleNode.parentNode.removeChild(styleNode);

							//if (styleNode.styleSheet && styleNode.styleSheet.cssRules) {
							//	for (j = 0; j < styleNode.styleSheet.cssRules.length; j++) {
							//		rule = styleNode.styleSheet.cssRules[j];

							//		if (rule.selectorText.toLowerCase() === "body") {
							//			rule.selectorText = ".event-content";
							//		} else {
							//			rule.selectorText = ".event-content " + rule.selectorText;
							//		}
							//	}
							//}
						}
					}

					frame.width = "100%";
					frame.height = "100%";

					// embed map
					frame.src = "ms-appx-web:///html/views/map.html"
						+ "?latitude=" + item.data.latitude
						+ "&longitude=" + item.data.longitude
						+ "&venue=" + item.data.venue;
					mapContainer.appendChild(frame);

					return node;
				}.bind(this));
			}.bind(this));
		},

		_createFlipView: function(events){
			var itemsList = new WinJS.Binding.List(events),
				flipViewContainer = document.getElementById("explore-flip-view");

			this.wc = new WinJS.UI.FlipView(flipViewContainer, {
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
			return this._helpers.win.ensureIsOnline();
		}
	});
});