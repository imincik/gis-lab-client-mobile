(function() {
	'use strict';

	angular
		.module('gl.map')
		.factory('projectProvider', ['mapBuilder', projectProvider]);

	function projectProvider(mapBuilder) {
		function ProjectProvider() {
			this.map = null;
			this.baseLayers = {
				tree: {},
				list: []
			};
			this.layers = {
				tree: {},
				list: []
			}
		}
		ProjectProvider.prototype.load = function(config) {
			this.config = config;
			if (this.map) {
				this.map.dispose();
			}
			this.map = mapBuilder.createMap(config);
			this.baseLayers.tree = config.base_layers;
			this.baseLayers.list = mapBuilder.layersTreeToList({layers: this.baseLayers.tree});
			this.layers.tree = config.layers;
			this.layers.list = mapBuilder.layersTreeToList({layers: this.layers.tree}, true);
		};
		return new ProjectProvider();
	};
})();
