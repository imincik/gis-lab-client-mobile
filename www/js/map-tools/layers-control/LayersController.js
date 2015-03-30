(function() {
	'use strict';

	angular
		.module('gl.layersControl')
		.controller('LayersController', LayersController);

	function LayersController($scope, projectProvider, mapBuilder) {
		//console.log('LayersController');
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
		$scope.layersVisibilityChanged = function(node) {
			var visible_layers = [];
			$scope.layers.list.forEach(function(layer_data) {
				if (!layer_data.isGroup && layer_data.visible) {
					visible_layers.push(layer_data.name);
				}
			});
			projectProvider.map.getLayer('qgislayer').setVisibleLayers(visible_layers);
		};

		$scope.layers = projectProvider.layers;
		var legends_urls = projectProvider.map.getLayer('qgislayer').getLegendUrls(projectProvider.map.getView());
		$scope.layers.list.forEach(function(layer_data) {
			layer_data.legendUrl = legends_urls[layer_data.name];
		});
		var test_base_layers = [
			{
				title: 'Group',
				layers: [
					{title: 'S1'},
					{title: 'S2'},
					{
						title: 'Subgroup',
						layers: [
							{title: 'SS1'},
							{
								title: 'Subsub-group',
								layers: [
									{title: 'SSS1'},
									{title: 'SSS2'}
								]
							},
							{title: 'Subsubitem3'},
							{
								title: 'Subsub-group',
								layers: [
									{title: 'SSS3'},
									{title: 'SSS4'},
									{title: 'SSS5', visible: true},
									{title: 'SSS6'}
								]
							},
						]
					}
				]
			},
			{title: 'I1'},
			{title: 'I2'},
		];
		$scope.baseLayers = projectProvider.baseLayers;
		//$scope.baseLayers.tree = test_base_layers;

		var selectedBaseLayer = {}
		$scope.baseLayers.list.forEach(function(base_layer) {
			base_layer.selected = selectedBaseLayer;
			if (base_layer.visible) {
				selectedBaseLayer.name = base_layer.name;
			}
		});
	};
})();
