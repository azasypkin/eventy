define(function () {
	"use strict";

	var parameterPlaceholderRegEx = /\{(\S*?)\}/g;

	return {
		/**
		* Replace every occurrence of parameter (in '{parameterName}' format) with the appropriate value from parameters object.
		* @param {String} stringToFormat String to format.
		* @param {Object} parameters Object that contains parameterName-parameterValue mapping.
		* @returns {String}
		*/
		format: function (stringToFormat, parameters) {
			if (stringToFormat && parameters) {
				return stringToFormat.replace(parameterPlaceholderRegEx, function (str, key) {
					if (parameters.hasOwnProperty(key)) {
						return parameters[key];
					}
					return str;
				});
			}
			return stringToFormat;
		}
	};
});
