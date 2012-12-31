define([],function(){
	"use strict";

	var SearchContract = WinJS.Class.define(function(){
		this._onSearchPaneVisibilityChanged = this._onSearchPaneVisibilityChanged.bind(this);
		this._onSearchPaneQueryChanged = this._onSearchPaneQueryChanged.bind(this);
		this._onSearchPaneQuerySubmitted = this._onSearchPaneQuerySubmitted.bind(this);
	}, {

		_state: null,
		_searchPane: null,

		setup: function(){
			this._searchPane = Windows.ApplicationModel.Search.SearchPane.getForCurrentView();

			this._searchPane.showOnKeyboardInput = true;

			this._searchPane.addEventListener("visibilitychanged", this._onSearchPaneVisibilityChanged, false);
			this._searchPane.addEventListener("querychanged", this._onSearchPaneQueryChanged, false);
			this._searchPane.addEventListener("querysubmitted", this._onSearchPaneQuerySubmitted, false);
		},

		unload: function(){
			this._searchPane.removeEventListener("visibilitychanged", this._onSearchPaneVisibilityChanged, false);
			this._searchPane.removeEventListener("querychanged", this._onSearchPaneQueryChanged, false);
			this._searchPane.removeEventListener("querysubmitted", this._onSearchPaneQuerySubmitted, false);

			this._searchPane = null;
		},

		setQueryText: function(queryText){
			this._searchPane.trySetQueryText(queryText);
		},

		_onSearchPaneVisibilityChanged: function (e) {
			this.dispatchEvent("visibility:changed", {
				visible: e.visible
			});
		},

		_onSearchPaneQueryChanged: function (e) {
			this.dispatchEvent("query:changed", {
				queryText:  e.queryText
			});
		},

		_onSearchPaneQuerySubmitted: function (e) {
			this.dispatchEvent("query:submitted", {
				queryText:  e.queryText
			});
		}
	});

	WinJS.Class.mix(SearchContract, WinJS.Utilities.eventMixin);

	return SearchContract;
});