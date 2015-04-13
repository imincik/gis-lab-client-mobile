(function() {
	'use strict';

	angular
		.module('gl.mobile')
		.controller('SettingsController', SettingsController);

	function SettingsController($scope) {
		$scope.showHeaderChanged = function() {
			console.log('showHeaderChanged');
		}
		$scope.$watch('$storage.showHeader', function(value) {
			console.log('watching showHeaderChanged');
			$scope.updateScreenSize();
		});
	};
})();
