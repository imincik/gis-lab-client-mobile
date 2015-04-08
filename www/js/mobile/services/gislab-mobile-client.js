(function() {
	'use strict';

	angular
		.module('gl.mobile')
		.config(['$httpProvider', function($httpProvider) {
			// Intercept POST requests, convert to standard form encoding
			$httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
			$httpProvider.defaults.transformRequest.unshift(function (data) {
				var key, result = [];
				for (key in data) {
					if (data.hasOwnProperty(key)) {
						result.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
					}
				}
				return result.join("&");
			});
		}])
		.factory('gislabMobileClient', ['$http', gislabMobileClient]);

	function gislabMobileClient($http) {
		function GislabMobileClient() {};

		GislabMobileClient.prototype.serverUrl = function(server) {
			//var template = this._secure? 'https://{0}' : 'http://{0}';
			var template = 'http://{0}';
			return template.format(server);
		};

		GislabMobileClient.prototype.login = function(server, username, password) {
			this._secure = true;
			/*
			return $http({
				method: 'POST',
				url: '{0}/mobile/login/'.format(this.serverUrl(server)),
				headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
				transformRequest: function(obj) {
					var str = [];
					for(var p in obj)
					str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
					return str.join("&");
				},
				data: {username: username, password: password},
			});*/
			return $http.post('{0}/mobile/login/'.format(this.serverUrl(server)), {
					username: username,
					password: password
				}, {
					withCredentials: true
				}
			);
		};

		GislabMobileClient.prototype.project = function(server, project) {
			var url;
			if (project && project !== 'empty') {
				url = '{0}/mobile/config.json?PROJECT={1}'.format(this.serverUrl(server), encodeURIComponent(project));
			} else {
				url = '{0}/mobile/config.json?'.format(this.serverUrl(server));
			}
			return $http.get(url, {
					withCredentials: true
			});
		};

		GislabMobileClient.prototype.userProjects = function(server) {
			return $http.get('{0}/projects.json'.format(this.serverUrl(server)), {
					withCredentials: true
			});
		};

		return new GislabMobileClient();
	};
})();
