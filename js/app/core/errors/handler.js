define(function (require) {
	"use strict";

	var ms = require("libs/ms"),
		StumbleError = require("libs/errors/stumble_error"),
		route = require("libs/route"),
		api = require("libs/api"),
		storage = require("libs/storage"),
		mediator = require("events/mediator");

	var errorCodes = StumbleError.Codes,
		genericErrorTitle = "Fiddlesticks!",
		genericErrorMessage = "Something has gone awry in Stumbleland. Please try again in a few.";

	var handleAPIErrors = function(error){
		var isHandled = false;

		if (error.originalError._code === 5030) {
			mediator.trigger("error:outOfStumbles", error);

			var mode = storage.get("searchKeyword") || storage.get("stumbleName");
			api.setStumbleMode();

			ms.showPrompt(
				"Honestly, we can't believe you made it this far.",
				"You've reached the end of your " + mode + " Stumble adventure. Wanna try again? Dive into another interest."
			).then(function(){
				storage.set("searchMode", false);
				storage.remove("searchKeyword");

				route.navigate("home");
			});

			isHandled = true;
		} else if (error.originalError._code === 5060) {
			//"5060" - STUMBLE_NO_INTERESTS
			isHandled = true;

			route.navigate("home");
		} else {
			// For now we agreed to handle all API errors
			isHandled = true;
			ms.showPrompt(genericErrorTitle, this.getDetailedUnhandledErrorMessage(error));
		}

		return isHandled;
	};

	return {
		handle: function(e){
			var error = e.detail.exception || e.detail.error || e.detail,
				isHandled = false,
				shouldBeLogged = true;

			// let's skip all cancel errors as it's not actual errors
			if(StumbleError.isCanceled(error)){
				isHandled = true;
			} else if(StumbleError.isStumbleError(error)){

				if(error.code === errorCodes.USER_NOT_AUTHENTICATED){
					isHandled = true;
					shouldBeLogged = false;

					route.navigate("loggedout");

				} else if(error.code === errorCodes.NO_INTERNET_CONNECTION){
					isHandled = true;
					shouldBeLogged = false;

					ms.showPrompt(
						"Oops! Where's the Internet?",
						"It appears you aren't connected to the interwebs. Please check connectivity and try again."
					).then(function(){
						route.navigate("loggedout");
					});

				} else if(error.code === errorCodes.API_ERROR){
					isHandled = handleAPIErrors(error);
				} else if(error.code === errorCodes.XHR_ERROR){
					// For now we agreed to handle all XHR errors
					isHandled = true;
					ms.showPrompt(genericErrorTitle, this.getDetailedUnhandledErrorMessage(error));
				} else if (error.code === errorCodes.FB_AUTH_FAILED
					|| error.code === errorCodes.FB_CANT_GET_USER
					|| error.code === errorCodes.FB_LINK_FAILED) {

					isHandled = true;

					ms.showPrompt(
						"Unable to connect to Facebook",
						"There was a problem trying to connect to Facebook.  Please try again later."
					);
				} else if(error.code === errorCodes.SIGNUP_FAILED){
					isHandled = true;

					ms.showPrompt(
						"Unable to sign up",
						"Unable to sign up. Please try again later."
					);
				}
			}

			if (!isHandled) {

				// This is just for development mode, we don't crash app but show error prompt
				if(this.isLoggingEnabled()){

					isHandled = true;

					ms.showPrompt(genericErrorTitle, this.getDetailedUnhandledErrorMessage(error));
				}

				MK.logLastChanceException(error);

			} else if(shouldBeLogged){
				ms.error(error);
			}

			return isHandled;
		},

		isLoggingEnabled: function(){
			return typeof window.suDM === "function" && window.suDM("logging");
		},

		getDetailedUnhandledErrorMessage: function(e){
			var message;

			if(this.isLoggingEnabled()){
				if(typeof e === "string"){
					message = e;
				} else {
					message = (StumbleError.isStumbleError(e) && e.originalError
						? e.originalError.message || e.originalError.description
						: null
					)
					|| e.message
					|| e.description;
				}
			}
			return message || genericErrorMessage;
		}
	};
});
