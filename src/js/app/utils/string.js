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
		},

		/**
		 * Generates hash for the string
		 * @param {String} stringToHash String for which hash should be generated.
		 * @returns {Integer}
		 */
		hash: function(stringToHash){
			var hash = 0,
				charCode,
				i;
			if (stringToHash.length === 0) {
				return hash;
			}
			for (i = 0; i < stringToHash.length; i++) {
				charCode = stringToHash.charCodeAt(i);
				hash = ((hash<<5)-hash)+charCode;
				// Convert to 32bit integer
				hash = hash & hash;
			}
			return hash;
		}
	};
});
