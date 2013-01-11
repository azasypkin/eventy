define(["underscore", "app/utils/win"], function (_, win) {
	"use strict";

	return {

		/**
		 * Read file from the "path" and applies underscore template function to its content and caches it
		 * @param {String} path Path to the file to be processed as template
		 * @returns {Function} Pre-compiled template function that accepts data object to fill template with
		 */
		getTemplate: _.memoize(function (path) {
			return win.getAppFileContent(path).then(function (data) {
				return _.template(data);
			});
		}),

		/**
		 * Read file from the "path" and applies underscore template function to its content and apply "data" to fill
		 * template with the actual values
		 * @param {String} pathOrTemplate Path to the file to be processed as template or ready template function
		 * @param {Object} data Data to be applied to template
		 * @returns {Node} Dom node parsed from string result of template function
		 */
		parseTemplateToDomNode: function(pathOrTemplate, data){
			// check whether we have ready template function instead of path
			if(typeof pathOrTemplate === "function"){
				return win.parseStringToHtmlDocument(pathOrTemplate(data)).body.firstChild;
			}
			return this.getTemplate(pathOrTemplate).then(function(template){
				return win.parseStringToHtmlDocument(template(data)).body.firstChild;
			});
		},

		/**
		 * Accepts an array of paths to templates and call "getTemplate" method for every template to save result in
		 * cache before it is actually used
		 * @param {Array} templates An array of string paths to files that contain template markup
		 * @returns {Promise} Promise that will be completed once all templates are pre-compiled
		 */
		preCompileTemplates: function (templates) {
			var templatesToProcess = templates || [];
			return WinJS.Promise.join(_.map(templatesToProcess, function(template){
				return this.getTemplate(template);
			}, this));
		}
	};
});
