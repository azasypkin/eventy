﻿define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";

	var promptPromise,
		domParser = new window.DOMParser(),
		winConnectivity = Windows.Networking.Connectivity;

	// Public Methods
	return {

		effects: {
			fadeIn: function(target){
				return WinJS.UI.Animation.fadeIn(target);
			},
			fadeOut: function(target){
				return WinJS.UI.Animation.fadeOut(target);
			},
			executeTransition: function(target, transition){
				return WinJS.UI.executeTransition(target, transition);
			}
		},

		render: function (path, container) {
			container.innerHTML = "";

			return WinJS.UI.Fragments.renderCopy(path)
			.then(function(renderedView) {

				container.appendChild(renderedView);
				return container;
			})
			.then(function(element){
				return WinJS.UI.processAll(element);
			});
		},

		hasClass: function(target, className){
			return WinJS.Utilities.hasClass(target, className);
		},

		addClass: function(target, className){
			return WinJS.Utilities.addClass(target, className);
		},

		removeClass: function(target, className){
			return WinJS.Utilities.removeClass(target, className);
		},

		toggleClass: function(target, className, toggle){
			if(typeof toggle === "boolean"){
				return WinJS.Utilities[toggle ? "addClass" : "removeClass"](target, className);
			} else {
				return WinJS.Utilities.toggleClass(target, className);
			}
		},

		/**
		* Displays modal prompt
		* @param {String} message Message content of the prompt to display (separated from options as it is required)
		* @param {String} title Title of the prompt to display (separated from options as it is required)
		* @param {Object} options Object that contains all additional prompt options. Currently supported:
		*  -- commands - list of the commands(buttons) to be displayed at prompt
		*  -- defaultCommandIndex - index of the command that will be invoked by default
		*  -- cancelCommandIndex - index of the command that will be invoked when escape is pressed
		* @returns {Promise}
		*/
		showPrompt: function (title, message, options) {
			var dialogTitle,
				dialogMessage,
				dialogOptions,
				command,
				i;

			// if the first argument is object then we treat it as options rather then title string
			// it's very handy for constructing complex message dialogs
			if(title && typeof title === "object"){
				dialogTitle = title.title;
				dialogMessage = title.message;
				dialogOptions = title;
			} else {
				dialogTitle = title;
				dialogMessage = message;
				dialogOptions = options;
			}

			if (dialogTitle && dialogMessage) {
				var messageDialog = new Windows.UI.Popups.MessageDialog(dialogMessage, dialogTitle);

				if (dialogOptions && dialogOptions.commands && dialogOptions.commands.length > 0) {
					for (i = 0; i < dialogOptions.commands.length; i++) {
						command = dialogOptions.commands[i];
						if(typeof command.label === "string") {
							messageDialog.commands.append(
								new Windows.UI.Popups.UICommand(command.label, command.handler, command.id)
							);
						}
					}
				}

				// Set the command that will be invoked by default
				if (dialogOptions && typeof dialogOptions.defaultCommandIndex === "number") {
					messageDialog.defaultCommandIndex = dialogOptions.defaultCommandIndex;
				}

				// Set the command to be invoked when escape is pressed
				if (dialogOptions && typeof dialogOptions.cancelCommandIndex === "number") {
					messageDialog.cancelCommandIndex = dialogOptions.cancelCommandIndex;
				}

				// avoiding "Access denied" exception when we try to show prompt repeatedly while we already
				// have shown one
				if (promptPromise) {
					promptPromise.cancel();
				}

				promptPromise =  messageDialog.showAsync().then(function () {
					promptPromise = null;
				});

				return promptPromise;
			}

			return WinJS.Promise.wrapError(new Error("Both title and message should be passed to display prompt."));
		},

		webAuth: function (url, callbackUrl) {
			return Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAsync(
				Windows.Security.Authentication.Web.WebAuthenticationOptions.none,
				Windows.Foundation.Uri(url),
				Windows.Foundation.Uri(callbackUrl)
			);
		},

		getNetworkConnectivityLevel: function() {
			var connectionProfile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();

			if (connectionProfile !== null) {
				return connectionProfile.getNetworkConnectivityLevel();
			}

			return null;
		},

		getFileContent: function(file) {
			return Windows.ApplicationModel.Package.current.installedLocation.getFileAsync(file)
			.then(Windows.Storage.FileIO.readTextAsync);
		},

		getAppFileStream: function(path){
			var url = new Windows.Foundation.Uri("ms-appx://" + path);

			return Windows.Storage.StorageFile.getFileFromApplicationUriAsync(url);
		},

		getAppFileContent: function (path) {
			return this.getAppFileStream(path).then(Windows.Storage.FileIO.readTextAsync);
		},

		launchURI: function(uriString){
			return Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(uriString));
		},

		parseStringToHtmlDocument: function (htmlString) {
			return domParser.parseFromString(htmlString, "text/html");
		},

		parseHtmlStringToDomNode: function (htmlString) {
			return WinJS.Promise.wrap(domParser.parseFromString(htmlString, "text/html").body.firstChild);
		},

		isOnline: function () {
			var connectionProfile;

			try{
				connectionProfile = winConnectivity.NetworkInformation.getInternetConnectionProfile();
				return connectionProfile !== null
					&& connectionProfile.getNetworkConnectivityLevel() !== winConnectivity.NetworkConnectivityLevel.none;
			} catch(e){
				return false;
			}
		},

		ensureIsOnline: function(){
			return this.isOnline()
				? WinJS.Promise.wrap()
				: WinJS.Promise.wrapError(
					new BaseError("No internet connection.", BaseError.Codes.NO_INTERNET_CONNECTION)
				);
		},

		xhr: function(options){
			var method = options.method ? options.method.toUpperCase() : "GET",
				requestParameters = {
					url: options.url,
					type: method
				},
				cacheEnabled = options.cache && options.cache.enabled && method === "GET",
				keys,
				key,
				data,
				i,
				cacheKey,
				cacheValue;

			if(options.parameters){
				data = "";
				keys = Object.keys(options.parameters);

				for(i = 0; i < keys.length; i++){
					key = keys[i];
					data += key + "=" + options.parameters[key] + "&";
				}
				data = data.slice(0, data.length - 1);

				if(method === "GET"){
					requestParameters.url += "?" + data;
				} else if(method === "POST") {
					requestParameters.data = data;
				}
			}

			// cache only get methods
			if(cacheEnabled){
				cacheKey = "request_" + options.cache.generateKey(requestParameters.url);
				cacheValue = options.cache.get(cacheKey);

				if(cacheValue){
					return WinJS.Promise.wrap(cacheValue);
				}
			}

			if(options.responseType){
				requestParameters.responseType = options.responseType;
			}

			if(options.headers){
				requestParameters.headers = options.headers;
			}

			if(options.timeout){
				requestParameters.timeout = options.timeout;
			}

			return WinJS.xhr(requestParameters).then(function(response){
				if(cacheEnabled){
					options.cache.add(cacheKey, response.responseText);
				}

				return response.responseText;
			}, function(e){
				return WinJS.Promise.wrapError(
					new BaseError("XHR request failed.", BaseError.Codes.XHR_FAILED, e)
				);
			});
		}
	};
});
