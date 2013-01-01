define(function(){
	"use strict";

	var View = WinJS.Class.define(function(_, config, proxy, state, helpers){
		this._ = _;
		this._config = config;
		this._proxy = proxy;
		this._state = state;
		this._helpers = helpers;

		this._onRoute = this._onRoute.bind(this);

		this._state.dispatcher.addEventListener("route", this._onRoute);

	}, {

		view: null,
		container: null,
		templates: {},

		render: function(){

			//this._preCompileTemplates();

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
		},

		_onRoute: function(){
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