(function() {
	'use strict';

	angular
		.module('gl.layersControl')
		.controller('LayersController', LayersController);

	function LayersController($scope, projectProvider, mapBuilder) {
		//console.log('LayersController');
		$scope.layers = {};
		$scope.setBaseLayer = function(layername) {
			if (!projectProvider.map)
				return;
			projectProvider.map.getLayers().forEach(function (layer) {
				if (layer.get('type') === 'baselayer') {
					if (layer.getVisible() && layer.get('name') !== layername) {
						layer.setVisible(false);
					}
					if (!layer.getVisible() && layer.get('name') === layername) {
						layer.setVisible(true);
					}
				}
			});
		};
		$scope.$watch('baseLayers.selected.name', function(layername) {
			$scope.setBaseLayer(layername);
		});
		$scope.layersVisibilityChanged = function(node) {
			var visible_layers = [];
			$scope.layers.list.forEach(function(layer_data) {
				if (!layer_data.isGroup && layer_data.visible) {
					visible_layers.push(layer_data.name);
				}
			});
			projectProvider.map.getLayer('qgislayer').setLayers(visible_layers);
		};

		$scope.layers.tree = projectProvider.config.layers;
		$scope.layers.list = mapBuilder.layersTreeToList({layers: $scope.layers.tree});
		var legends_urls = projectProvider.map.getLayer('qgislayer').getLegendUrls(projectProvider.map.getView());
		$scope.layers.list.forEach(function(layer_data) {
			layer_data.legendUrl = legends_urls[layer_data.name];
		});
		var test_base_layers = [
			{
				title: 'Group',
				layers: [
					{title: 'Subitem1'},
					{title: 'Subitem2'},
					{
						title: 'Subgroup',
						layers: [
							{title: 'Subsubitem1'},
							{title: 'Subsubitem2'},
							{title: 'Subsubitem3'},
						]
					}
				]
			},
			{title: 'Third'},
			{title: 'Fourth'},
		];
		//$scope.baseLayers.tree = test_base_layers;
		$scope.baseLayers.tree = projectProvider.config.base_layers;
		$scope.baseLayers.list = mapBuilder.layersTreeToList({layers: $scope.baseLayers.tree});
		$scope.baseLayers.list.forEach(function(base_layer) {
			base_layer.selected = $scope.baseLayers.selected;
			if (base_layer.visible) {
				$scope.baseLayers.selected.name = base_layer.name;
			}
		});
	};
})();
