(function() {
	'use strict';

	angular
		.module('gl.mobile')
		.controller('StartupConfigController', StartupConfigController);

	function StartupConfigController($scope, $timeout, gislabMobileClient) {
		console.log('StartupConfigController');
		$scope.init = function() {
			console.log('StartupConfigController INIT');
		}
		$scope.wizardLogin = function() {
			if ($scope.$storage.username && $scope.$storage.password) {
				$scope.showProgressDialog($scope.app.progressBar, 'Login to GIS.lab server');
				$scope.login()
					.then(function() {
						$scope.setProgressBarMessage('Loading lsit of user projects ...');
						gislabMobileClient.userProjects($scope.$storage.serverUrl)
							.success(function(data, status, headers, config) {
								if (angular.isArray(data)) {
									$scope.userProjects = data;
								}
								$scope.hideProgressDialog($scope.app.progressBar, 500, $scope.app.wizard.carousel.next, $scope.app.wizard.carousel);
							})
							.error(function(data, status, headers, config) {
								console.log('error: '+status);
							});
						
					}, function() {
						$scope.hideProgressDialog($scope.app.progressBar, 500, ons.notification.alert, null, {
							title: 'Warning',
							message: 'Login to GIS.lab server has failed.'
						});
					})
			} else {
				$scope.app.wizard.carousel.next();
			}
		};
		$scope.finish = function() {
			$scope.app.wizard.hide();
			$scope.loadProjectWithProgressBar($scope.$storage.project);
		};
		//$scope.userProjects = [{project: 'project1'}, {project: 'project2'}, {project: 'project3'}];
	};
})();