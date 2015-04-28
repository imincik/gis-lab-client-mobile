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
						$scope.setProgressBarMessage('Loading list of user projects ...');
						gislabMobileClient.userProjects()
							.success(function(data, status, headers, config) {
								if (angular.isArray(data)) {
									data.forEach(function(projectData) {
										projectData.publish_date_text = new Date(projectData.publication_time_unix*1000).toLocaleString();
										projectData.expiration_date_text = projectData.expiration_time_unix? new Date(projectData.expiration_time_unix*1000).toLocaleString() : '-';
									});
									$scope.userProjects = data;
								}
								$scope.hideProgressDialog($scope.app.progressBar, 500, $scope.app.wizard.carousel.next, $scope.app.wizard.carousel);
							})
							.error(function(data, status, headers, config) {
								/*
								$scope.hideProgressDialog($scope.app.progressBar, 500, ons.notification.alert, null, {
									title: 'Warning',
									message: 'Failed to load list of your projects.'
								});*/
								$scope.hideProgressDialog($scope.app.progressBar, 500, function() {
									$scope.app.wizard.carousel.next();
									ons.notification.alert({
										title: 'Warning',
										message: 'Failed to load list of yours projects.'
									});
								});
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
