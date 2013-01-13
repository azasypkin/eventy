define(function () {
	"use strict";

	var defaultErrorMessage = "Unknown error",
		canceledErrorName = "Canceled";

	var BaseError = function (message, code, originalError) {
		this.message = message || defaultErrorMessage;
		this.code = code;
		this.originalError = originalError;
	};

	BaseError.prototype = new window.Error();
	BaseError.prototype.constructor = BaseError;

	BaseError.Codes = {
		NO_INTERNET_CONNECTION: 0,
		USER_NOT_AUTHENTICATED: 1,
		XHR_FAILED: 2,
		API_FAILED: 3,

		STORAGE_REQUEST_FAILED: 4,
		LOCATION_REQUEST_FAILED: 5,

		AUTHENTICATION_FAILED: 6,

		INTERNAL_ERROR: 12,

		SHARE_FAILED: 13
	};

	// method for determining if error is the result of promise.cancel call
	BaseError.isCanceled = function (e) {
		return e instanceof window.Error
			&& e.name === canceledErrorName
			&& e.description === canceledErrorName &&
			e.message === canceledErrorName;
	};

	BaseError.isBaseError = function(e){
		return e instanceof BaseError;
	};

	return BaseError;
});
