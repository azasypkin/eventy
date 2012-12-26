define(function(){
	"use strict";

	return WinJS.Class.define(function(_, config, helpers){
		this._ = _;
		this._config = config;
		this._helpers = helpers;
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

		}
	});
});