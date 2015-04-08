(function() {
	'use strict';

	angular
		.module('gl.layersControl')
		.factory('layersControl', [layersControl]);

	function layersControl() {
		function LayersControl() {};

		LayersControl.prototype.syncWithMap = function(map, layersModel) {
			var overlaysLayer = map.getLayer('qgislayer');
			if (overlaysLayer) {
				var visible_layers = overlaysLayer.getSource().getVisibleLayers();
				var needs_update = false;
				var visible_layers_nodes = [];
				layersModel.list.forEach(function(layer_model) {
					//console.log(layer_model);
					var visible = visible_layers.indexOf(layer_model.name) != -1;
					if (visible) {
						visible_layers_nodes.push(layer_model);
					}
					if (layer_model.visible != visible) {
						layer_model.visible = visible;
						needs_update = true;
					}
				});
				if (needs_update) {
					layersModel.tree.updateGroupsCheckState();
				}
			}
		};
		return new LayersControl();
	};
})();
