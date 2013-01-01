define(["config","app/utils/datetime"
],	function (config, dateUtils) {
		"use strict";

		return {
			date: function(value, format) {
				return value.repeats
					? config.labels["Proxy.TimePeriods.RepeatingEvent"]
					: dateUtils.formatDate(new Date(dateUtils.offsetDate(value.date, value.offset)), format || "MMM dd, yyyy HH:mm");
			}
		};
	}
);