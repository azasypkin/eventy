define(function () {
	"use strict";

	return WinJS.Class.define(function(options){
		var keys = Object.keys(options),
			key,
			i;
		for(i=0; i < keys.length; i++){
			key = keys[i];

			this[key] = options[key];
		}
	});
});