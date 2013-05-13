define(function () {
	"use strict";

	return WinJS.Class.define(function(_, config, proxy, state, helpers){
		this._ = _;
		this._config = config;
		this._proxy = proxy;
		this._state = state;
		this._helpers = helpers;

		this.ready = this.ready.bind(this);
	},{
		ready: function (element, options) {
			element.querySelector("#app-version").innerText = this._helpers.string.format(
				"{major}.{minor}.{build}.{revision}",
				Windows.ApplicationModel.Package.current.id.version
			);
		}
	});
});