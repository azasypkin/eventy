﻿define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	var errorCodes = BaseError.Codes,
		genericErrorTitle = "Aw, snap!",
		genericErrorMessage = "Something has gone wrong with your request. Please try again in a few seconds.";

	var handleAPIErrors = function(error){
		var isHandled = false;

		if (error.originalError.error_type === "Request Error") {
			this._helpers.win.showPrompt(
				"Eventbrite can't process request.",
				"It seems that something wrong with Eventbrite data. Please, try again later."
			);
			isHandled = true;
		} else if (error.originalError.error_type === "Authentication Error") {
			this._helpers.win.showPrompt(
				"Eventbrite can't authenticate your request.",
				"Please, try to connect your account to Eventbrite once again."
			).then(function(){
				this._state.user.signOut();

				WinJS.Navigation.navigate("welcome");
			});

			isHandled = true;
		}

		return isHandled;
	};

	return WinJS.Class.define(function(config, helpers, state, analytics){
		this._config = config;
		this._helpers = helpers;
		this._state = state;
		this._analytics = analytics;
	}, {
		handle: function(e){
			var error = e.detail.exception || e.detail.error || e.detail,
				isHandled = false,
				shouldBeLogged = true;

			// let's skip all cancel errors as it's not actual errors
			if(BaseError.isCanceled(error)){
				isHandled = true;
			} else if(BaseError.isBaseError(error)){
				if(error.code === errorCodes.NO_INTERNET_CONNECTION){
					isHandled = true;
					shouldBeLogged = false;

					this._helpers.win.showPrompt(
						"No internet connection!",
						"It looks like you aren't connected to the internet. Please check connectivity and try again."
					);

				} else if(error.code === errorCodes.API_FAILED){
					isHandled = handleAPIErrors(error);
				} else if(error.code === errorCodes.XHR_FAILED){
					// For now we agreed to handle all XHR errors
					isHandled = true;
					this._helpers.win.showPrompt(
						genericErrorTitle,
						this.getDetailedUnhandledErrorMessage(error)
					);
				}
			}

			if (!isHandled) {

				// This is just for development mode, we don't crash app but show error prompt
				if(this.isDevelopmentMode()){

					isHandled = true;

					this._helpers.win.showPrompt(genericErrorTitle, this.getDetailedUnhandledErrorMessage(error));
				}

				this._analytics.logLastChanceException(error);

			} else if(shouldBeLogged){
				this._analytics.error(error);
			}

			return isHandled;
		},

		isDevelopmentMode: function(){
			return this._config.mode === "development";
		},

		getDetailedUnhandledErrorMessage: function(e){
			var message;

			if(this.isDevelopmentMode()){
				if(typeof e === "string"){
					message = e;
				} else {
					message = (BaseError.isBaseError(e) && e.originalError
						? e.originalError.message || e.originalError.description
						: null
						)
						|| e.message
						|| e.description;
				}
			}
			return message || genericErrorMessage;
		}
	});
});
