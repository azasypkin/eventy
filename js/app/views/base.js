define(function(){
	"use strict";

	return WinJS.Class.define(function(config){
		this._config = config;
	}, {

		view: null,
		container: null,

		render: function(){
			return this._innerRender(this.view, this.container);
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