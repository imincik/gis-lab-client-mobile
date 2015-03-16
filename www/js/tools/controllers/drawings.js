angular.module('gl.tools')
	.controller('DrawingsController', function($scope, $timeout) {
		$scope.gridOptions = {  };
		$scope.gridOptions.columnDefs = [
			{ name: 'firstName', enableCellEdit: true, width: '30%' },
			{ name: 'lastName', enableCellEdit: true,  width: '30%' },
		];
		$scope.gridOptions.data = [
			{
				"firstName": "Cox",
				"lastName": "Carney"
			}, {
				"firstName": "Joe",
				"lastName": "Satriani"
			}
		];
	});
