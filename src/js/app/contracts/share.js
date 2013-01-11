define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	var ShareContract = WinJS.Class.define(function(config, state){
		this._onDataRequested = this._onDataRequested.bind(this);
		this._config = config;
		this._state = state;
	}, {
		setup: function(){
			this._dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();

			this._dataTransferManager.addEventListener("datarequested", this._onDataRequested, false);
		},

		unload: function(){
			this._dataTransferManager.removeEventListener("datarequested", this._onDataRequested, false);

			this._dataTransferManager = null;
		},

		_onDataRequested: function (e) {
			var shareRequest = e.request,
				shareDeferral = shareRequest.getDeferral();

			this.dispatchEvent("requested");

			shareRequest.data.properties.applicationName = this._config.name;

			if (this._state.page && this._state.page.isShareSupported()) {

				this._state.page.getDataToShare().then(function(pageDataToShare){
					if(pageDataToShare){
						shareRequest.data.setUri(new Windows.Foundation.Uri(pageDataToShare.url));

						shareRequest.data.properties.title = pageDataToShare.title;
						shareRequest.data.properties.description = pageDataToShare.description;

						if (pageDataToShare.thumbnail) {
							shareRequest.data.properties.thumbnail = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(
								new Windows.Foundation.Uri(pageDataToShare.thumbnail)
							);
						}

						shareDeferral.complete();
					} else {
						return WinJS.Promise.wrapError(
							new BaseError("Can't retrieve data to share.", BaseError.Codes.SHARE_FAILED)
						);
					}
				}).then(null, function(){
					shareRequest.failWithDisplayText("Please, try again later.");
				});
			} else {
				shareRequest.failWithDisplayText('Explore any event and try again.');
			}
		}
	});

	WinJS.Class.mix(ShareContract, WinJS.Utilities.eventMixin);

	return ShareContract;
});
