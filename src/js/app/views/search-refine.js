﻿define(["app/views/base", "rText!templates/views/search-refine.html"],function(BaseView, LayoutTemplate){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this.templates = {
			layout: this._helpers.template.htmlStringToTemplate(LayoutTemplate)
		};

		this._onSearchButtonClicked = this._onSearchButtonClicked.bind(this);
		this._onFilterSubmitted = this._onFilterSubmitted.bind(this);
		this._onFilterSelectChange = this._onFilterSelectChange.bind(this);
		this._onFilterQueryChange = this._onFilterQueryChange.bind(this);

		this._onSearchPaneQueryChanged = this._onSearchPaneQueryChanged.bind(this);

		this._onAfterHide = this._onAfterHide.bind(this);

		this._state.contracts.search.addEventListener("query:changed", this._onSearchPaneQueryChanged, false);
	}, {

		container: document.getElementById("search-refine-flyout"),

		render: function(anchor){
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				this.wc = new WinJS.UI.Flyout(this.container, {
					anchor: anchor,
					placement:	"top",
					alignment:	"left",
					layout:		"custom"
				});

				this.wc.addEventListener("afterhide", this._onAfterHide, false);

				this.container.querySelector("#search-button").addEventListener("click", this._onSearchButtonClicked, false);
			}.bind(this));
		},

		show: function(){
			this._toggleHandlers(true);

			this.wc.show();
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this.wc.removeEventListener("afterhide", this._onAfterHide, false);

			this.container.querySelector("#search-button").addEventListener("click", this._onSearchButtonClicked, false);

			this._state.contracts.search.removeEventListener("query:changed", this._onSearchPaneQueryChanged, false);
		},

		update: function(state){
			var filter = document.getElementById("search-refine-form"),
				cityInput = filter["search-city"],
				isCurrentLocation,
				eventActionMethodName;

			if (typeof state.query === "string" && filter["search-query"].value !== state.query) {
				filter["search-query"].value = state.query;
			}

			if(state.useCurrentLocation){
				cityInput.value = "";

				cityInput.placeholder = this._config.getString("Location.Current");
			} else {
				if(typeof state.city === "string" && cityInput.value !== state.city){
					cityInput.value = state.city;
				}

				cityInput.placeholder = this._config.getString("Location.DefaultPlaceHolder");
			}

			if (typeof state.within === "string" && filter["search-within"].value !== state.within) {
				filter["search-within"].value = state.within;
			}

			if (typeof state.withinType === "string" && filter["search-within-type"].value !== state.withinType) {
				filter["search-within-type"].value = state.withinType;
			}

			if(typeof state.date === "string" && filter["search-date"].value !== state.date){
				filter["search-date"].value = state.date;
			}
		},

		submitFilterForm: function(form){
			this._state.dispatcher.dispatchEvent("filter:submitted", {
				city:       form["search-city"].value,
				query:      form["search-query"].value,
				date:		form["search-date"].value,
				within:		form["search-within"].value,
				withinType:	form["search-within-type"].value
			});
		},

		_toggleHandlers: function(attach){
			var filter = document.getElementById("search-refine-form"),
				eventActionMethodName = attach ? "addEventListener" : "removeEventListener";

			filter[eventActionMethodName]("submit", this._onFilterSubmitted);
			filter["search-date"][eventActionMethodName]("change", this._onFilterSelectChange);
			filter["search-within"][eventActionMethodName]("change", this._onFilterSelectChange);
			filter["search-within-type"][eventActionMethodName]("change", this._onFilterSelectChange);
			filter["search-query"][eventActionMethodName]("change", this._onFilterQueryChange);

			this._state.contracts.search.setShowOnKeyboardInput(!attach);
		},

		_onAfterHide: function(){
			this._toggleHandlers(false);
		},

		_onFilterSubmitted: function (e) {
			e.preventDefault();

			this.wc.hide();

			this.submitFilterForm(e.target);
		},

		_onFilterSelectChange: function (e) {
			this.submitFilterForm(e.target.form);
		},

		_onSearchButtonClicked: function (e) {
			this.submitFilterForm(e.target.form);
		},

		_onFilterQueryChange: function(e){
			this._state.contracts.search.setQueryText(e.target.value ? e.target.value : "");
		},

		_onSearchPaneQueryChanged: function (e) {
			// disable query field once search charm is displayed
			document.getElementById("search-refine-form")["search-query"].value = e.detail.queryText;
		}
	});
});