(function() {
	'use strict';

	angular
		.module('gl.topics')
		.controller('LegendController', LegendController);

	function LegendController($scope, projectProvider) {
		$scope.layers = projectProvider.layers;
		var legends_urls = projectProvider.map.getLayer('qgislayer').getLegendUrls(projectProvider.map.getView());
		$scope.layers.list.forEach(function(layer_data) {
			layer_data.legendUrl = legends_urls[layer_data.name];
		});
	};
})();
