(function() {
	'use strict';

	angular
		.module('gl.map')
		.factory('mapBuilder', [mapBuilder]);

	function mapBuilder() {
		function MapBuilder() {};

		MapBuilder.prototype.layersTreeToList = function(layers_tree, skip_groups) {
			var list = [];
			var visit_node = function(list, layer_data, depth) {
				if (!depth) {
					depth = 0;
				}
				layer_data.title = layer_data.title? layer_data.title : layer_data.name;
				//layer_data.title += 'asdsfsfsd f sefeert ter';
				layer_data.depth = depth;
				if (layer_data.layers) {
					if (!skip_groups && layer_data.title) {
						layer_data.isGroup = true;
						list.push(layer_data);
					}
					var group_visible = true;
					layer_data.layers.forEach(function(child_data) {
						visit_node(list, child_data, depth+1);
						if (!child_data.visible) {
							group_visible = false;
						}
					});
					layer_data.visible = group_visible;
				} else if (layer_data) {
					layer_data.isGroup = false;
					list.push(layer_data);
				}
				return list;
			};
			visit_node(list, layers_tree);
			return list;
		};

		MapBuilder.prototype.createBaseLayer = function(config) {
			var base_layer;
			if (config.type === 'BLANK') {
				base_layer = new ol.layer.Image({
					extent: config.extent,
					visible: config.visible
				});
			} else if (config.type === 'OSM') {
				base_layer = new ol.layer.Tile({
					source: new ol.source.OSM(),
					extent: config.extent,
					visible: config.visible
				});
			} else if (config.type === 'WMS') {
				base_layer = new ol.layer.Image({
					source: new ol.source.ImageWMS({
						url: config.url,
						resolutions: config.resolutions,
						params: {
							'LAYERS': config.wms_layers.join(','),
							'FORMAT': config.format,
							'TRANSPARENT': 'false'
						},
						serverType: ol.source.wms.ServerType.MAPSERVER,
						//attributions: [new ol.Attribution({html: '<p>bla bla</p>'})]
					}),
					extent: config.extent
				});
			}
			if (base_layer) {
				base_layer.set('type', 'baselayer');
				base_layer.set('name', config.name);
			}
			return base_layer;
		};

		MapBuilder.prototype.createProjectLayer = function(config) {
			var overlays_layer;
			if (config.layers) {
				if (config.mapcache_url) {
					overlays_layer = new ol.layer.WebgisTmsLayer({
						project: config.project,
						tilesUrl: config.mapcache_url,
						legendUrl: config.legend_url,
						source: new ol.source.TileImage({
							tileGrid: new ol.tilegrid.TileGrid ({
								origin: ol.extent.getBottomLeft(config.project_extent),
								resolutions: config.tile_resolutions,
								tileSize: 256
							}),
							tileUrlFunction: function(tileCoord, pixelRatio, projection) {
								var z = tileCoord[0];
								var x = tileCoord[1];
								var y = tileCoord[2];
								var url = this.tileUrlTemplate
									.replace('{z}', z.toString())
									.replace('{x}', x.toString())
									.replace('{y}', y.toString());
								return url;
							},
							//tilePixelRatio: 1.325
						}),
						extent: config.project_extent,
					});
				} else {
					overlays_layer = new ol.layer.WebgisWmsLayer({
						source: new ol.source.ImageWMS({
							url: config.ows_url,
							params: {
								'PROJECT': config.project,
								'FORMAT': 'image/png',
							},
							serverType: ol.source.wms.ServerType.QGIS
						}),
						extent: config.project_extent,
					});
				}
				overlays_layer.set('type', 'qgislayer');
				overlays_layer.set('name', 'qgislayer');
				var layers_data = this.layersTreeToList({layers: config.layers}, true);
				var visible_layers = [];
				var attributions = {};
				layers_data.forEach(function(layer_config) {
					if (layer_config.visible) {
						visible_layers.push(layer_config.name);
					}
					var attribution = layer_config.attribution;
					if (attribution) {
						var attribution_html;
						if (attribution.url) {
							attribution_html = '<a href="{0}" target="_blank">{1}</a>'.format(attribution.url, attribution.title);
						} else {
							attribution_html = attribution.title;
						}
						attributions[layer_config.name] = new ol.Attribution({html: attribution_html});
					}
				});
				overlays_layer.setLayersAttributions(attributions);
				overlays_layer.setLayers(visible_layers);
			}
			return overlays_layer;
		};

		MapBuilder.prototype.createMap = function(config) {
			var layers = [];
			var base_layers_configs = this.layersTreeToList({layers: config.base_layers}, true);
			base_layers_configs.forEach(function(baselayer_config) {
				var base_layer = this.createBaseLayer(baselayer_config);
				if (base_layer) {
					layers.push(base_layer);
				}
			}, this);

			var overlays_layer = this.createProjectLayer(config);
			if (overlays_layer) {
				layers.push(overlays_layer);
			}
			var map = new ol.Map({
				target: config.target,
				layers: layers,
				view: new ol.View({
					projection: new ol.proj.Projection({
						code: config.projection.code,
						units: config.units,
						extent: config.project_extent,
					}),
					resolutions: config.tile_resolutions,
					extent: config.project_extent,
				}),
				controls: ol.control.defaults({
					attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
						collapsible: true,
						label: '©',
						//label: goog.dom.createDom(goog.dom.TagName.I, 'fa fa-copyright', ''),
					})
				}),
				renderer: ol.RendererType.CANVAS
			});
			map.getView().fitExtent(config.zoom_extent, map.getSize());
			return map;
		};
		return new MapBuilder();
	};
})();
