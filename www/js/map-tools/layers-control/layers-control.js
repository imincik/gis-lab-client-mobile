(function() {
	'use strict';

	angular
		.module('gl.layersControl')
		.factory('layersControl', ['projectProvider', layersControl]);

	function layersControl(projectProvider) {
		function LayersControl() {};

		LayersControl.prototype.load = function(config) {
			this.config = config;
			if (this.map) {
				this.map.dispose();
			}
			this.map = mapBuilder.createMap(config);
			this.baseLayers.tree = config.base_layers;
			this.baseLayers.list = mapBuilder.layersTreeToList({layers: this.baseLayers.tree}, true);
			this.layers.tree = config.layers;
			this.layers.list = mapBuilder.layersTreeToList({layers: this.layers.tree}, true);
		};

		LayersControl.prototype.activate = function() {
			var visible_layers = projectProvider.map.getLayer('qgislayer').getVisibleLayers();
			var needs_update = false;
			var visible_layers_nodes = [];
			projectProvider.layers.list.forEach(function(layer_model) {
				var visible = visible_layers.indexOf(layer_model.name) != -1;
				if (visible) {
					visible_layers_nodes.push(layer_model);
				}
				if (layer_model.visible != visible) {
					needs_update = true;
				}
			});
			if (needs_update) {
				//ivhTreeviewMgr.deselectAll(projectProvider.layers.tree);
				//ivhTreeviewMgr.selectEach(projectProvider.layers.tree, visible_layers_nodes);
			}
		};
		return new LayersControl();
	};
})();
