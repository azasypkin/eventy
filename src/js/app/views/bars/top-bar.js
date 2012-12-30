define(["app/views/bars/base", "app/views/navigation-menu"],function(BaseView, NavigationMenu){
	"use strict";

	return WinJS.Class.derive(BaseView, function(){
		BaseView.apply(this, arguments);

		this._onBackButtonClicked = this._onBackButtonClicked.bind(this);
		this._onHeaderClicked = this._onHeaderClicked.bind(this);

		this._navigationMenu = Object.create(NavigationMenu.prototype);

		NavigationMenu.apply(this._navigationMenu, arguments);
	}, {

		view: "/html/views/bars/top-bar.html",
		container: document.getElementById("top-bar"),

		type: "top",

		render: function(){
			return BaseView.prototype.render.apply(this, arguments).then(function(){
				var titleArea = document.querySelector(".title-area");
				document.getElementById("cmdBack").addEventListener("click", this._onBackButtonClicked, false);
				titleArea.addEventListener("click", this._onHeaderClicked, false);
				return this._navigationMenu.render(titleArea);
			}.bind(this));
		},

		getBarProperties: function(){
			return {
				layout:'custom',
				placement: this.type,
				sticky: true,
				disabled: true
			};
		},

		unload: function(){
			BaseView.prototype.unload.apply(this, arguments);

			this._navigationMenu.unload.apply(this._navigationMenu, arguments);
			this._navigationMenu = null;

			document.getElementById("cmdBack").removeEventListener("click", this._onBackButtonClicked, false);
		},

		_updateBackButtonState: function(){
			document.getElementById("cmdBack").disabled = !WinJS.Navigation.canGoBack;
		},

		_onUpdateBarState: function(e){
			var secondaryTitle,
				parameters = e && e.detail;
			BaseView.prototype._onUpdateBarState.apply(this, arguments);
			if(parameters){
				// if type isn't passed that means that even related to both top and bottom bars
				if(!parameters.type || (parameters.type && parameters.type === this.type)){
					if(typeof parameters.title === "string"){
						document.getElementById("page-title").innerText = parameters.title;
					}

					if(parameters.secondaryTitle){
						secondaryTitle = document.getElementById("page-secondary-title");
						if(typeof parameters.secondaryTitle.title === "string"){
							secondaryTitle.innerText = parameters.secondaryTitle.title;
						}

						if(parameters.secondaryTitle.color){
							secondaryTitle.style.color = parameters.secondaryTitle.color;
						}
					}
				}
			}
		},

		_onRoute: function(){
			BaseView.prototype._onRoute.apply(this, arguments);

			this._updateBackButtonState();
		},

		_onBackButtonClicked: function(){
			WinJS.Navigation.back(1);
		},

		_onHeaderClicked: function(){
			this._navigationMenu.show();
		}

	});
});