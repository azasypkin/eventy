define(["app/core/errors/base_error"], function (BaseError) {
	"use strict";
	return WinJS.Class.define(function(config, helpers){
		this._config = config;
		this._helpers = helpers;

		this._accessCodeUrl = this._helpers.string.format(
			this._config.oAuthAccessCodeUrl,
			{appKey: this._config.appKey}
		);
	}, {
		authenticate: function(){
			return this._helpers.win.webAuth(this._accessCodeUrl, "http://localhost/").then(function(result){
				var uri,
					queryParameter,
					accessCode,
					i;
				if (result.responseStatus === Windows.Security.Authentication.Web.WebAuthenticationStatus.success) {
					uri = new Windows.Foundation.Uri(result.responseData);
					for(i = 0; i < uri.queryParsed.length; i++){
						queryParameter = uri.queryParsed[i];
						if(queryParameter.name === "code"){
							accessCode = queryParameter.value;
							break;
						}
					}
					if(accessCode){
						return this.retrieveToken(accessCode).then(function(token){
							return {
								code: accessCode,
								token: token
							};
						}.bind(this));
					}
				} else if (result.responseStatus === Windows.Security.Authentication.Web.WebAuthenticationStatus.errorHttp) {
					return WinJS.Promise.wrapError(
						new BaseError("The operation failed because a HTTP error was returned.", BaseError.Codes.AUTHENTICATION_FAILED)
					);
				}
				return "";
			}.bind(this)).then(null, function(e){
				return WinJS.Promise.wrapError(
					new BaseError("User was unable to authenticate", BaseError.Codes.AUTHENTICATION_FAILED, e)
				);
			});
		},

		retrieveToken: function(accessCode){
			return WinJS.xhr({
				url: this._config.oAuthAccessTokenUrl,
				type: "POST",
				data: this._helpers.string.format(this._config.oAuthAccessTokenPostData, {
					code: accessCode,
					client_secret: this._config.oAuthClientSecret,
					client_id: this._config.appKey
				}) ,
				headers: {"Content-type": "application/x-www-form-urlencoded"}
			}).then(function(data){
				return JSON.parse(data.responseText).access_token;
			});
		}
	});
});