define(function(){
	"use strict";

	var View = WinJS.Class.define(function(_, config, proxy, directoryProxy, state, helpers){
		this._ = _;
		this._config = config;
		this._proxy = proxy;
		this._directoryProxy = directoryProxy;
		this._state = state;
		this._helpers = helpers;

		this._onRoute = this._onRoute.bind(this);
		this._onWindowResized = this._onWindowResized.bind(this);

		this._state.dispatcher.addEventListener("route", this._onRoute);
		window.addEventListener("resize", this._onWindowResized, false);

	}, {

		container: null,
		templates: {},

		isSnapped: false,

		render: function () {
			var renderPromise;

			this.isSnapped = Windows.UI.ViewManagement.ApplicationView.value === Windows.UI.ViewManagement.ApplicationViewState.snapped;

			if (this.templates && this.templates.layout) {
				this.container.innerHTML = "";
				renderPromise = this._helpers.template.parseTemplateToDomNode(this.templates.layout, {
					config: this._config
				}).then(function(renderedView) {
					this.container.appendChild(renderedView);
					return this.container;
				}.bind(this));
			} else {
				renderPromise = WinJS.Promise.wrap(this.container);
			}

			return renderPromise.then(function(container){
				return WinJS.UI.processAll(container);
			});
		},

		dispatchEvent: function(name, data){
			this._state.dispatcher.dispatchEvent(
				this.eventPrefix ? this.eventPrefix + ":" + name : name, data
			);
		},

		unload: function(){
			this._state.dispatcher.removeEventListener("route", this._onRoute);

			window.removeEventListener("resize", this._onWindowResized, false);
		},

		_onRoute: function(){
		},

		_onSnapped: function () {
			this.isSnapped = true;
		},

		_onUnSnapped: function () {
			this.isSnapped = false;
		},

		_onWindowResized: function () {
			if (Windows.UI.ViewManagement.ApplicationView.value === Windows.UI.ViewManagement.ApplicationViewState.snapped && !this.isSnapped) {
				this._onSnapped();
			} else if(this.isSnapped) {
				this._onUnSnapped();
			}
		},

		raiseEvent: function(name, data){
			this.dispatchEvent("event", {
				name: name,
				data: data
			});
		}
	});

	WinJS.Class.mix(View, WinJS.Utilities.eventMixin);

	return View;
});