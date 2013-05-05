define([
	"app/views/pages/base"
],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(_, config, proxy, directoryProxy, state, helpers, layoutTemplate,
													itemTemplate){
		BaseView.call(this, _, config, proxy, directoryProxy, state, helpers);

		this.templates = {
			layout: this._helpers.template.htmlStringToTemplate(layoutTemplate),
			item: this._helpers.template.htmlStringToTemplate(itemTemplate)
		};

		this.onSelectionChanged = this.onSelectionChanged.bind(this);
		this.onItemInvoked = this.onItemInvoked.bind(this);
		this.onLoadingStateChanged = this.onLoadingStateChanged.bind(this);

		this._onTileImageLoad = this._onTileImageLoad.bind(this);
		this._onTileImageError = this._onTileImageError.bind(this);

		this.onExploreCommandInvoked = this.onExploreCommandInvoked.bind(this);

		this._state.dispatcher.addEventListener("command:explore", this.onExploreCommandInvoked);
	}, {

		container: document.getElementById("content"),

		searchOnKeyboardInput: true,

		wc: null,

		_itemTemplate: function(itemPromise){
			return itemPromise.then(function (item) {
				return this._helpers.template.parseTemplateToDomNode(
						this.templates.item,
						this.getItemTemplateData(item.data)
					).then(function(node){
						return this.processItemNode(node, item.data);
					}.bind(this));
			}.bind(this));
		},

		getItemTemplateData: function(item){
			return null;
		},

		processItemNode: function(node, item){
			var imageTag = node.querySelector("img");

			if (imageTag) {
				imageTag.addEventListener("load", this._onTileImageLoad, false);
				imageTag.addEventListener("error", this._onTileImageError, false);
			}

			return node;
		},

		_exploreItems: function(items){
			if(items.length > 0){
				WinJS.Navigation.navigate("explore/"+items[0].id, {
					params: {
						items: items
					}
				});
			}
		},

		createListView: function(){
			this.wc = new WinJS.UI.ListView(document.getElementById("event-list-view"), {
				layout: { type: this.isSnapped ? WinJS.UI.ListLayout : WinJS.UI.GridLayout },
				itemTemplate: this._itemTemplate.bind(this)
			});

			this.wc.addEventListener("selectionchanged", this.onSelectionChanged, false);
			this.wc.addEventListener("iteminvoked", this.onItemInvoked, false);
			this.wc.addEventListener("loadingstatechanged", this.onLoadingStateChanged, false);
		},

		_removeImageListeners: function (img) {
			img.removeEventListener("load", this._onTileImageLoad, false);
			img.removeEventListener("error", this._onTileImageError, false);

			// we don't need this image tag anymore(we mirror it in background-image css), let's reduce memory consumption by removing it
			img.parentNode.removeChild(img);

			img = null;
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			if (this.wc) {
				this.wc.removeEventListener("selectionchanged", this.onSelectionChanged, false);
				this.wc.removeEventListener("iteminvoked", this.onItemInvoked, false);
				this.wc.removeEventListener("loadingstatechanged", this.onLoadingStateChanged, false);
			}

			this._helpers.noData.hide();

			this._state.dispatcher.removeEventListener("command:explore", this.onExploreCommandInvoked);
		},

		onSelectionChanged: function () {
			this.wc.selection.getItems().then(function(items){
				var hasItemsSelected = items.length > 0,
					properties = {
						type: "bottom"
					};

				properties[hasItemsSelected ? "showCommands" : "hideCommands"] = ["globalSeparator", "explore"];

				if(hasItemsSelected){
					properties.show = hasItemsSelected;
				}

				this._state.dispatcher.dispatchEvent("updateBarState", properties);
			}.bind(this));
		},

		onItemInvoked: function (e) {
			e.detail.itemPromise.then(function (item) {
				this._exploreItems([item.data]);
			}.bind(this));
		},

		onLoadingStateChanged: function(e){
			if (e.target.winControl.loadingState === "itemsLoaded") {
				e.target.winControl.itemDataSource.getCount().then(function(count){
					if(count === 0){
						this._helpers.noData.show();
					}
				}.bind(this));
			}
		},

		onExploreCommandInvoked: function(){
			this.wc.selection.getItems().then(function(items){
				var ids = [],
					result = [],
					item,
					i;
				for(i = 0; i < items.length; i++){
					item = items[i].data;
					if(ids.indexOf(item.id) < 0){
						result.push(item);
						ids.push(item.id);
					}
				}
				this._exploreItems(result);
			}.bind(this));
		},

		_onTileImageLoad: function (e) {
			// we need to remember parent node, because image will be removed in onTileImageLoaded
			var parentContainer = e.target.parentNode;

			parentContainer.style.backgroundImage = "url(" + e.target.src + ")";

			this._removeImageListeners(e.target);

			this._helpers.win.effects.executeTransition(parentContainer, {
				property: "opacity",
				delay: Math.floor(Math.random() * 1000),
				duration: 550,
				timing: "linear",
				from: 0,
				to: 1
			});
		},

		_onTileImageError: function (e) {
			e.target.parentNode.style.backgroundImage = "url(/img/no-thumbnail.png)";

			this._removeImageListeners(e.target);
		},

		_onSnapped: function () {
			BaseView.prototype._onSnapped.apply(this, arguments);

			if(this.wc){
				WinJS.UI.setOptions(this.wc, {
					layout: {
						type: WinJS.UI.ListLayout
					}
				});
			}
		},

		_onUnSnapped: function () {
			BaseView.prototype._onUnSnapped.apply(this, arguments);
			if(this.wc){
				WinJS.UI.setOptions(this.wc, {
					layout: {
						type: WinJS.UI.GridLayout
					}
				});
			}
		}
	});
});