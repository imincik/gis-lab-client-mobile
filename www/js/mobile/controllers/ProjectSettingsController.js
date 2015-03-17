(function() {
	'use strict';

	angular
		.module('gl.mobile')
		.controller('ProjectSettingsController', ProjectSettingsController);

	function ProjectSettingsController($scope, gislabMobileClient) {
		gislabMobileClient.userProjects($scope.$storage.serverUrl)
			.success(function(data, status, headers, config) {
				if (angular.isArray(data)) {
					$scope.project.myProjects = data;
				}
			})
			.error(function(data, status, headers, config) {
				console.log('error: '+status);
			});
	};
})();
