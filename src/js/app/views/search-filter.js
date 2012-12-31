define(["app/views/base"],function(BaseView){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onFilterSubmitted = this._onFilterSubmitted.bind(this);
		this._onFilterSelectChange = this._onFilterSelectChange.bind(this);
		this._onFilterQueryChange = this._onFilterQueryChange.bind(this);

		this._onSearchPaneVisibilityChanged = this._onSearchPaneVisibilityChanged.bind(this);
		this._onSearchPaneQueryChanged = this._onSearchPaneQueryChanged.bind(this);

		this._state.contracts.search.addEventListener("visibility:changed", this._onSearchPaneVisibilityChanged, false);
		this._state.contracts.search.addEventListener("query:changed", this._onSearchPaneQueryChanged, false);
	}, {

		view: "/html/views/search-filter.html",

		render: function(container){
			this.container = container;
			return BaseView.prototype.render.apply(this, arguments);
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this._state.contracts.search.removeEventListener("visibility:changed", this._onSearchPaneVisibilityChanged, false);
			this._state.contracts.search.removeEventListener("query:changed", this._onSearchPaneQueryChanged, false);
		},

		update: function(state){
			var filter = document.getElementById("search-filter-form");

			if (typeof state.query === "string") {
				filter["search-query"].value = state.query;
			}

			if(typeof state.location === "string"){
				filter["search-location"].value = state.location;
			}

			if(typeof state.date === "string"){
				filter["search-date"].value = state.date;
			}

			if(state.show === true){
				this.container.style.display = "block";
				filter.addEventListener("submit", this._onFilterSubmitted);
				filter["search-date"].addEventListener("change", this._onFilterSelectChange);
				filter["search-query"].addEventListener("change", this._onFilterQueryChange);

				WinJS.UI.Animation.enterContent(this.container, null);
			} else if (state.show === false){
				filter.removeEventListener("submit", this._onFilterSubmitted);
				filter["search-date"].removeEventListener("change", this._onFilterSelectChange);
				filter["search-query"].removeEventListener("change", this._onFilterQueryChange);

				WinJS.UI.Animation.exitContent(this.container, null).then(function(){
					this.container.style.display = "none";
				}.bind(this));
			}
		},

		submitFilterForm: function(form){
			this._state.dispatcher.dispatchEvent("filter:submitted", {
				location:	form["search-location"].value,
				query:		form["search-query"].value,
				date:		form["search-date"].value
			});
		},

		_onFilterSubmitted: function (e) {
			e.preventDefault();
			this.submitFilterForm(e.target);
		},

		_onFilterSelectChange: function (e) {
			this.submitFilterForm(e.target.form);
		},

		_onFilterQueryChange: function(e){
			this._state.contracts.search.setQueryText(e.target.value ? e.target.value : "");
		},

		_onSearchPaneVisibilityChanged: function (e) {
			// disable query field once search charm is displayed
			document.getElementById("search-filter-form")["search-query"].disabled = e.detail.visible;
		},

		_onSearchPaneQueryChanged: function (e) {
			// disable query field once search charm is displayed
			document.getElementById("search-filter-form")["search-query"].value = e.detail.queryText;
		}
	});
});