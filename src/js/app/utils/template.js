define(["underscore", "app/utils/win", "app/utils/string"], function (_, win, str) {
	"use strict";

	return {

		/**
		 * Read file from the "path" and applies underscore template function to its content and caches it
		 * @param {String} path Path to the file to be processed as template
		 * @returns {Function} Pre-compiled template function that accepts data object to fill template with
		 */
		getTemplateByPath: _.memoize(function (path) {
			return win.getAppFileContent(path).then(function (content) {
				return this.htmlStringToTemplate(content);
			}.bind(this));
		}),

		/**
		 * Applies underscore template function to html string
		 * @param {String} path Path to the file to be processed as template
		 * @returns {Function} Pre-compiled template function that accepts data object to fill template with
		 */
		htmlStringToTemplate: _.memoize(function (content) {
			return _.template(content);
		}, str.hash),

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
				return win.parseHtmlStringToDomNode(pathOrTemplate(data));
			}
			return this.getTemplateByPath(pathOrTemplate).then(function(template){
				return win.parseHtmlStringToDomNode(template(data));
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
				return this.getTemplateByPath(template);
			}, this));
		}
	};
});
