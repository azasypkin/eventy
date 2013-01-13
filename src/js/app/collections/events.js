define(function () {
	"use strict";

	var DataAdapter = WinJS.Class.define(function(_, config, proxy, parameters, parent) {
		this._ =  _;
		this._config = config;
		this._parameters = parameters;
		this._proxy = proxy;
		this._parent = parent;

		this.itemsFromIndex = this.itemsFromIndex.bind(this);
		this.getCount = this.getCount.bind(this);
	}, {

		_count: -1,

		itemsFromIndex: function (requestIndex) {

			// To optimize using of cache on memcache/redis we should use the same pages while requesting data.
			// Page is equal to "maxPageSize" and we should determine which page will contain requested item
			var requestedPageIndex = Math.floor(requestIndex / this._config.pageSize),
				fetchStartIndex = requestedPageIndex * this._config.pageSize;

			return this._proxy.searchEvents(this._.extend({
				max: this._config.pageSize,
				page: requestedPageIndex + 1
			}, this._parameters)).then(function(data){
				var items = [],
					i;

				this._count = data.total;

				return {
					totalCount: data.total,
					offset: requestIndex - fetchStartIndex,
					items: this._.map(data.items, function(item, index){
						return {
							data:item,
							key: item.id
						};
					}),
					absoluteIndex: requestIndex
				};
			}.bind(this), function(e){
				this._parent.dispatchEvent("error", e);
				return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.noResponse));
			}.bind(this));
		},

		getCount: function () {
			if(this._count < 0){
				this._count = this._config.pageSize;
			}
			return WinJS.Promise.wrap(this._count);
		}
	});

	return WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
		var adapter = Object.create(DataAdapter.prototype),
			parameters = arguments;

		[].push.call(parameters, this);

		DataAdapter.apply(adapter, parameters);

		this._baseDataSourceConstructor(adapter);
	});
});