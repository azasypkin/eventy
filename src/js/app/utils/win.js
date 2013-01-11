define(function () {
	"use strict";

	var promptPromise,
		domParser = new window.DOMParser();

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
				return WinJS.UI.Animation.executeTransition(target, transition);
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

		addClass: function(target, className){
			return WinJS.Utilities.addClass(target, className);
		},

		removeClass: function(target, className){
			return WinJS.Utilities.removeClass(target, className);
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
		}
	};
});
