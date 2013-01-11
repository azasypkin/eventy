define(["libs/requirejs/plugins/i18n!app/config/localization/nls/labels"], function (labels) {
	"use strict";

	return {
		version: "1.0.0.0",

		name: "Eventy",

		author: {
			company: "ALZA",
			copyRights: "Copyright &copy; ALZA 2013"
		},

		labels: labels,

		proxies: {
			eventbrite: {
				url: "https://www.eventbrite.com/json/",
				oAuthAccessCodeUrl: "https://www.eventbrite.com/oauth/authorize?response_type=code&client_id={appKey}",
				oAuthAccessTokenUrl: "https://www.eventbrite.com/oauth/token",
				oAuthClientSecret: "MNEQTU7SLUFJBALEPOHSBEJI7W3Z4JDSG3HAP7R4WPUJZ72SFB",
				oAuthAccessTokenPostData: "code={code}&client_secret={client_secret}&client_id={client_id}&grant_type=authorization_code",
				appKey: "VJEDOCS2JTNP7MGHPS",
				dataType: "json",
				timeout: 10000,

				pageSize: 20,

				categories: {
					music: "music",
					sports: "sports",
					conventions: "conventions",
					movies: "movies",
					conferences: "conferences",
					fairs: "fairs",
					entertainment: "entertainment",
					performances: "performances",
					social: "social",
					endurance: "endurance",
					recreation: "recreation",
					travel:"travel",
					seminars: "seminars",
					reunions: "reunions",
					sales: "sales",
					comedy: "comedy",
					religion: "religion",
					meetings: "meetings",
					food: "food",
					fundraisers: "fundraisers",
					other: "other"
				},
				timePeriods: {
					today: "today",
					this_week: "this week",
					next_week: "next week",
					this_month: "this month",
					next_month: "next month",
					future: "future",
					past: "past",
					all: "all"
				},
				// http://developer.eventbrite.com/doc/timezones/
				timezones: {
					// in minutes
					"US/Pacific": -480,
					"America/Los_Angeles": -480,
					"US/Mountain": -420,
					"US/Arizona": -420,
					"America/Denver": -420,

					"US/Central": -360,
					"America/Chicago": -360,

					"US/Eastern": -300,
					"America/New_York":-300,

					"Europe/London": 0,
					"Europe/Stockholm": 60,
					"Europe/Paris":60,
					"Europe/Berlin": 60,

					"Australia/Sydney":600,
					"Australia/Adelaide":570,
					"Asia/Singapore":480,
					"Pacific/Auckland": 720,
					"Africa/Harare": 120
				}
			},

			virtualearth: {
				url: "http://dev.virtualearth.net/REST/v1/Locations/",
				appKey: "Ar92F19O81BpjUSvAxUWAsjcCZV1TvsK4qRp2XCDO2BWpt9y8rCmCdp3tKqkWEQ5",
				dataType: "json",
				// in milliseconds
				timeout: 10000
			}
		},

		dictionaries: {
			categories: {
				music: {
					color: "#ff872f",
					name: labels["Proxy.Categories.Music"]
				},
				sports: {
					color: "#9c1f1f",
					name: labels["Proxy.Categories.Sports"]
				},
				conventions: {
					color: "#1f9c66",
					name: labels["Proxy.Categories.Conventions"]
				},
				movies: {
					color: "#9c1f8b",
					name: labels["Proxy.Categories.Movies_Film"]
				},
				conferences: {
					color: "#9c891f",
					name: labels["Proxy.Categories.Conference"]
				},
				fairs: {
					color: "#ffa326",
					name: labels["Proxy.Categories.Fairs"]
				},
				entertainment: {
					color: "#e88600",
					name: labels["Proxy.Categories.Entertainment"]
				},
				performances: {
					color: "#ffd200",
					name: labels["Proxy.Categories.Performing_Arts"]
				},
				social: {
					color: "#6d197a",
					name: labels["Proxy.Categories.Social"]
				},
				endurance: {
					color: "#fe7f76",
					name: labels["Proxy.Categories.Endurance"]
				},
				recreation: {
					color: "#df6961",
					name: labels["Proxy.Categories.Outdoors_Recreation"]
				},
				travel:{
					color: "#dd3327",
					name: labels["Proxy.Categories.Travel"]
				},
				seminars: {
					color: "#421f9c",
					name: labels["Proxy.Categories.Seminars"]
				},
				reunions:{
					color: "#2f166f",
					name: labels["Proxy.Categories.Schools_Alumni"]
				},
				sales: {
					color: "#00599d",
					name: labels["Proxy.Categories.Business"]
				},
				comedy: {
					color: "#975500",
					name: labels["Proxy.Categories.Comedy"]
				},
				religion:{
					color: "#1f689c",
					name: labels["Proxy.Categories.Religion_Spirituality"]
				},
				meetings: {
					color: "#3b5998",
					name: labels["Proxy.Categories.Meetings"]
				},
				food: {
					color: "#6f7a56",
					name: labels["Proxy.Categories.Food"]
				},
				fundraisers: {
					color: "#63a8dd",
					name: labels["Proxy.Categories.Fundraisers"]
				},
				other: {
					color: "#2ba825",
					name: labels["Proxy.Categories.Other"]
				}
			},
			timePeriods: {
				today: {
					name: labels["Proxy.TimePeriods.Today"]
				},
				this_week: {
					name: labels["Proxy.TimePeriods.This_Week"]
				},
				next_week: {
					name: labels["Proxy.TimePeriods.Next_Week"]
				},
				this_month: {
					name: labels["Proxy.TimePeriods.This_Month"]
				},
				next_month: {
					name: labels["Proxy.TimePeriods.Next_Month"]
				},
				future: {
					name: labels["Proxy.TimePeriods.Future"]
				},
				past: {
					name: labels["Proxy.TimePeriods.Past"]
				},
				all: {
					name: labels["Proxy.TimePeriods.All"]
				}
			}
		},

		eventsPerPage: 20,

		state: {
			storageKey: "eventy_state.json"
		},
		/*tiles: {
			maxQueueLength: 5,
			defaultWideTemplate: Windows.UI.Notifications.TileTemplateType.tileWideText01,
			defaultSquareTemplate: Windows.UI.Notifications.TileTemplateType.tileSquareText03,
			branding: {
				NONE: "none",
				NAME: "name",
				LOGO: "logo"
			},
			// in days
			expirationTime: 1
		},*/
		localization: {
			timezones: [
				{ name: "(GMT -12:00) Eniwetok, Kwajalein", offset: -12 },
				{ name: "(GMT -11:00) Midway Island; Samoa", offset: -11 },
				{ name: "(GMT -10:00) Hawaii", offset: -10 },
				{ name: "(GMT -09:00) Alaska", offset: -9 },
				{ name: "(GMT -08:00) Pacific Time (US &amp; Canada); Tijuana", offset: -8 },
				{ name: "(GMT -07:00) Arizona", offset: -7},
				{ name: "(GMT -07:00) Mountain Time (US &amp; Canada)", offset: -7 },
				{ name: "(GMT -06:00) Central America", offset: -6 },
				{ name: "(GMT -06:00) Central Time (US &amp; Canada)", offset: -6 },
				{ name: "(GMT -06:00) Mexico City", offset: -6 },
				{ name: "(GMT -06:00) Saskatchewan", offset: -6 },
				{ name: "(GMT -05:00) Bogota, Lima, Quito", offset: -5 },
				{ name: "(GMT -05:00) Eastern Time (US &amp; Canada)", offset: -5 },
				{ name: "(GMT -05:00) Indiana (East)", offset: -5 },
				{ name: "(GMT -04:00) Atlantic Time (Canada)", offset: -4 },
				{ name: "(GMT -04:00) Caracas, La Paz", offset: -4 },
				{ name: "(GMT -04:00) Santiago", offset: -4 },
				{ name: "(GMT -03:30) Newfoundland", offset: -3.5 },
				{ name: "(GMT -03:00) Brasilia", offset: -3 },
				{ name: "(GMT -03:00) Buenos Aires, Georgetown", offset: -3 },
				{ name: "(GMT -03:00) Greenland", offset: -3 },
				{ name: "(GMT -02:00) Mid-Atlantic", offset: -2 },
				{ name: "(GMT -01:00) Azores", offset: -1 },
				{ name: "(GMT -01:00) Cape Verde Is", offset: -1 },
				{ name: "(GMT) Casablanca, Monrovia", offset: 0 },
				{ name: "(GMT) Greenwich Mean Time: Dublin, London", offset: 0 },
				{ name: "(GMT +01:00) Amsterdam, Berlin, Rome", offset: 1 },
				{ name: "(GMT +01:00) Belgrade, Prague, Budapest", offset: 1 },
				{ name: "(GMT +01:00) Brussels, Copenhagen, Madrid, Paris", offset: 1 },
				{ name: "(GMT +01:00) Sarajevo, Warsaw, Zagreb", offset: 1 },
				{ name: "(GMT +01:00) West Central Africa", offset: 1 },
				{ name: "(GMT +02:00) Athens, Istanbul", offset: 2 },
				{ name: "(GMT +02:00) Bucharest", offset: 2 },
				{ name: "(GMT +02:00) Cairo", offset: 2 },
				{ name: "(GMT +02:00) Harare, Pretoria", offset: 2 },
				{ name: "(GMT +02:00) Helsinki, Riga, Tallinn", offset: 2 },
				{ name: "(GMT +02:00) Jerusalem", offset: 2 },
				{ name: "(GMT +03:00) Baghdad", offset: 3 },
				{ name: "(GMT +03:00) Kuwait, Riyadh", offset: 3 },
				{ name: "(GMT +03:00) Moscow, St. Petersburg, Volgograd, Minsk", offset: 3 },
				{ name: "(GMT +03:00) Nairobi", offset: 3 },
				{ name: "(GMT +03:30) Tehran", offset: 3.5 },
				{ name: "(GMT +04:00) Abu Dhabi, Muscat", offset: 4 },
				{ name: "(GMT +04:00) Baku, Tbilisi, Yerevan", offset: 4 },
				{ name: "(GMT +04:30) Kabul", offset: 4.5 },
				{ name: "(GMT +05:00) Ekaterinburg", offset: 5 },
				{ name: "(GMT +05:00) Islamabad, Karachi, Tashkent", offset: 5 },
				{ name: "(GMT +05:30) Calcutta, Chennai, Mumbai, New Delhi", offset: 5.5 },
				{ name: "(GMT +05:45) Kathmandu", offset: 5.75 },
				{ name: "(GMT +06:00) Almaty, Novosibirsk", offset: 6 },
				{ name: "(GMT +06:00) Astana, Dhaka", offset: 6 },
				{ name: "(GMT +06:00) Sri Jayawardenepura", offset: 6 },
				{ name: "(GMT +06:30) Rangoon", offset: 6.5 },
				{ name: "(GMT +07:00) Bangkok, Hanoi, Jakarta", offset: 7 },
				{ name: "(GMT +07:00) Krasnoyarsk", offset: 7 },
				{ name: "(GMT +08:00) Beijing, Chongqing, Hong Kong, Urumqi", offset: 8 },
				{ name: "(GMT +08:00) Irkutsk, Ulaan Bataar", offset: 8 },
				{ name: "(GMT +08:00) Kuala Lumpur, Singapore", offset: 8 },
				{ name: "(GMT +08:00) Perth", offset: 8 },
				{ name: "(GMT +08:00) Taipei", offset: 8 },
				{ name: "(GMT +09:00) Osaka, Sapporo, Tokyo", offset: 9 },
				{ name: "(GMT +09:00) Seoul", offset: 9 },
				{ name: "(GMT +09:00) Yakutsk", offset: 9 },
				{ name: "(GMT +09:30) Adelaide", offset: 9.5 },
				{ name: "(GMT +09:30) Darwin", offset: 9.5 },
				{ name: "(GMT +10:00) Brisbane", offset: 10 },
				{ name: "(GMT +10:00) Canberra, Melbourne, Sydney", offset: 10 },
				{ name: "(GMT +10:00) Guam, Port Moresby", offset: 10 },
				{ name: "(GMT +10:00) Hobart", offset: 10 },
				{ name: "(GMT +10:00) Vladivostok", offset: 10 },
				{ name: "(GMT +11:00) Magadan, Solomon Is., New Caledonia", offset: 11 },
				{ name: "(GMT +12:00) Auckland, Wellington", offset: 12 },
				{ name: "(GMT +12:00) Fiji, Kamchatka, Marshall Is.", offset: 12 },
				{ name: "(GMT +13:00) Nuku'alofa", offset: 13 }
			]
		}
	};
});