define(["config","app/utils/datetime"
],	function (config, dateUtils) {
		"use strict";

		return {
			date: function(value, format) {
				return value.repeats
					? config.getString("Proxy.TimePeriods.RepeatingEvent")
					: dateUtils.formatDate(new Date(dateUtils.offsetDate(value.date, value.offset)), format || "EE, NNN d, yyyy h:mm a");
			}
		};
	}
);