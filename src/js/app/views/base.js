define(function(){
	"use strict";

	var View = WinJS.Class.define(function(_, config, proxy, state, helpers){
		this._ = _;
		this._config = config;
		this._proxy = proxy;
		this._state = state;
		this._helpers = helpers;

		this._onRoute = this._onRoute.bind(this);
		this._onWindowResized = this._onWindowResized.bind(this);

		this._state.dispatcher.addEventListener("route", this._onRoute);
		window.addEventListener("resize", this._onWindowResized, false);

	}, {

		view: null,
		container: null,
		templates: {},

		isSnapped: false,

		render: function () {

			this.isSnapped = Windows.UI.ViewManagement.ApplicationView.value === Windows.UI.ViewManagement.ApplicationViewState.snapped;

			return this._innerRender(this.view, this.container);
		},

		_preCompileTemplates: function(){
			var templateKeys = Object.keys(this.templates),
				templateKey,
				i;

			if(templateKeys.length > 0){
				for(i = 0; i < templateKeys.length; i++){
					templateKey = templateKeys[i];
					this.templates[templateKey] = this._helpers.template.getTemplate(this.templates[templateKey]);
				}
			}
		},

		dispatchEvent: function(name, data){
			this._state.dispatcher.dispatchEvent(
				this.eventPrefix ? this.eventPrefix + ":" + name : name, data
			);
		},

		_innerRender: function (path, container) {
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