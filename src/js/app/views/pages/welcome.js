﻿define([
	"app/views/pages/base",
	"rText!templates/views/pages/welcome/layout.html"
],function(BaseView, LayoutTemplate){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this.templates = {
			layout: this._helpers.template.htmlStringToTemplate(LayoutTemplate)
		};

		this._onTryButtonClicked = this._onTryButtonClicked.bind(this);
		this._onConnectButtonClicked = this._onConnectButtonClicked.bind(this);
	}, {

		container: document.getElementById("content"),

		_navigateToNextPage: function(){
			var categories = this._state.user.get("categories");
			WinJS.Navigation.navigate(categories && categories.length > 0 ? "home":"firstTime_categories", {
				keepHistory: false
			}).then(function(){
				this._state.counters.set("firstTimeVisit", false);
			}.bind(this));
		},

		getBarsSettings: function(){
			return [{
				type: "top",
				enabled: false
			}, {
				type: "bottom",
				enabled: false
			}];
		},

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				this._state.counters.set("firstTimeVisit", true);

				document.getElementById("btn-try").addEventListener("click", this._onTryButtonClicked, false);
				document.getElementById("btn-connect").addEventListener("click", this._onConnectButtonClicked, false);
			}.bind(this));
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			var btnTry = document.getElementById("btn-try"),
				btnConnect = document.getElementById("btn-connect");

			if(btnTry){
				btnTry.removeEventListener("click", this._onTryButtonClicked, false);
			}

			if(btnConnect){
				btnConnect.removeEventListener("click", this._onConnectButtonClicked, false);
			}
		},

		_onTryButtonClicked: function(){
			this._navigateToNextPage();
		},

		_onConnectButtonClicked: function(){
			WinJS.UI.SettingsFlyout.showSettings("account-setting-container", "/js/templates/views/settings/account.html");
		}
	});
});