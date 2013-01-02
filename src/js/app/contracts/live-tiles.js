define(function (){
	"use strict";

	var winNotifications = Windows.UI.Notifications;

	return WinJS.Class.define(function(){
		this._tileUpdater = winNotifications.TileUpdateManager.createTileUpdaterForApplication();
		this._template = winNotifications.TileTemplateType.tileWideImageAndText01;
		this._maxTileCycleSize = 5;
	}, {
		populate: function(items){
			var item,
				tileAdded = 0,
				tileXml,
				tileNotification,
				tileTitleEl,
				tileImgEl,
				i;

			if(items.length > 0){

				this._tileUpdater.clear();
				this._tileUpdater.enableNotificationQueue(true);

				for(i = 0; i < items.length && tileAdded < this._maxTileCycleSize; i++){
					item = items[i].data;

					if(item.thumbnail){
						tileXml = winNotifications.TileUpdateManager.getTemplateContent(this._template),
							tileNotification = new winNotifications.TileNotification(tileXml),
							tileTitleEl = tileXml.getElementsByTagName("text")[0],
							tileImgEl = tileXml.getElementsByTagName("image")[0];

						tileImgEl.setAttribute("src", item.thumbnail ? item.thumbnail : "/img/no-thumbnail.png");
						tileTitleEl.innerText = item.title;

						this._tileUpdater.update(tileNotification);

						tileAdded++;
					}
				}
			}
		}
	});
});