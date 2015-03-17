(function() {
	'use strict';

	angular
		.module('app')
		.factory('gislabMobileClient', ['$http', gislabMobileClient]);

	function gislabMobileClient($http) {
		return {
			login: function(server, username, password) {
				/*
				return $http({
					method: 'POST',
					url: '{0}/mobile/login/'.format(server),
					headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
					transformRequest: function(obj) {
						var str = [];
						for(var p in obj)
						str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
						return str.join("&");
					},
					data: {username: username, password: password},
				});*/
				return $http.post('{0}/mobile/login/'.format(server), {
						username: username,
						password: password
					}, {
						withCredentials: true
				});
			},
			project: function(server, project) {
				return $http.get('{0}/mobile/config.json?PROJECT={1}'.format(server, encodeURIComponent(project)),{
						withCredentials: true
				});
			},
			userProjects: function(server) {
				return $http.get('{0}/projects.json'.format(server), {
						withCredentials: true
				});
			}
		};
	};
})();
