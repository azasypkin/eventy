define(["app/core/errors/base_error"], function (BaseError) {
	/*"use strict";

	// Modules
	var ms = require("libs/ms"),
		api = require("libs/api"),
		AuthM = require('models/auth'),
		mediator = require('events/mediator'),
		StumbleError = require("libs/errors/stumble_error");

	var authM = new AuthM({type: "facebook"}),
		oAuthCallbackUrl = "https://www.facebook.com/connect/login_success.html",
		fbGraphMeUrl = "https://graph.facebook.com/me?access_token=",
		oAuthUrl = "https://www.facebook.com/dialog/oauth?client_id=" + appId +
					"&redirect_uri=https%3A%2F%2Fwww.facebook.com%2Fconnect%2Flogin_success.html" +
					"&scope=publish_actions,email,user_birthday&display=popup&response_type=token";

	// Private Methods

	var authenticate = function(){
		return ms.webAuth(oAuthUrl, oAuthCallbackUrl)
			.then(parseOAuth)
			.then(null, function(e){
				return WinJS.Promise.wrapError(
					new StumbleError("Facebook auth failed", StumbleError.Codes.FB_AUTH_FAILED, e)
				);
			});
	};

	var parseOAuth = function (result) {
		return new WinJS.Promise(function(complete, error){
			var res = result.responseData,
				errorMsg;
			if (res.indexOf("access_token") > -1) {
				authM.set('token', res.split('access_token=')[1].split('&')[0]);
				authM.set('token_lifetime', res.split('expires_in=')[1]);
				complete();
				return;
			}

			if (res.indexOf("error_reason") > -1) {
				errorMsg = res.split("?error_reason=")[1].split('&')[0];
			}

			if (errorMsg === 'user_denied' || res === ''){
				errorMsg = 'canceled';
			}

			error(errorMsg);
		});
	};

	var getFBUser = function() {
		return ms.xhr({url: fbGraphMeUrl + authM.get('token')})
			.then(parseFBUser)
			.then(null, function(e){
				return WinJS.Promise.wrapError(
					new StumbleError("Can't get facebook user info.", StumbleError.Codes.FB_CANT_GET_USER, e)
				);
			});
	};

	var parseFBUser = function(response) {
		authM.set(JSON.parse(response.responseText));
		return authM;
	};

	var handleError = function (e) {
		var isHandled = false;

		if (e instanceof StumbleError && e.originalError) {
			if(e.code === StumbleError.Codes.API_FAILED && (e.originalError._code === 14030 || e.originalError._code === 14001)){
				isHandled = true;
				existingAccountHandler();
			} else if(e.code === StumbleError.Codes.FB_AUTH_FAILED && e.originalError === "canceled"){
				isHandled = true;
			}
		}

		mediator.trigger("auth:linkfailed", e);

		if(!isHandled){
			return WinJS.Promise.wrapError(e);
		}
	};

	var existingAccountHandler = function () {
		var email = authM.get("email");

		ms.showPrompt({
			title: "Connect this Facebook account",
			message: "There is already a StumbleUpon account using " + email
				+ " but it is not connected to this Facebook account yet.  Would you like to connect the accounts?  You will need provide the account password to do so.",
			commands: [{
				label: "Connect the Accounts",
				handler: function () {
					mediator.trigger("auth:linkrequested", email, authM);
				}
			}, {
				label: "Cancel"
			}],
			defaultCommandIndex: 0,
			// when user press Escape button we should just postpone rate prompt and not decline
			cancelCommandIndex: 1
		});
	};

	// Public Methods
	return {
		signin: function() {
			return authenticate()
				.then(getFBUser)
				.then(api.login)
				.then(ms.silentSuccess, handleError);

		}
	};*/

	"use strict";
	return WinJS.Class.define(function(config, win){
		this._config = config;
		this._win = win;

		this._url = this._config.oAuthUrl.replace("{appKey}", this._config.appKey);
	}, {
		authenticate: function(){
			return this._win.webAuth(this._url, "http://localhost/").then(function(result){
				var uri,
					queryParameter,
					i;
				if(result && result.responseData){
					uri = new Windows.Foundation.Uri(result.responseData);
					for(i = 0; i < uri.queryParsed.length; i++){
						queryParameter = uri.queryParsed[i];
						if(queryParameter.name === "code"){
							return queryParameter.value;
						}
					}
				}
				return "";
			}).then(null, function(e){
				return WinJS.Promise.wrapError(
					new BaseError("User was unable to authenticate", BaseError.Codes.AUTHENTICATION_FAILED, e)
				);
			});
		}
	});
});