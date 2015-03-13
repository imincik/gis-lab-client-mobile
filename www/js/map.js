
var webgis = angular.module('webgis', []);

goog.provide('ol.control.ButtonControl');
goog.provide('ol.layer.WebgisTmsLayer');
goog.provide('ol.layer.WebgisWmsLayer');
goog.require('ol.control.Control');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Image');

ol.control.ButtonControl = function(opt_options) {

	var options = opt_options || {};

	var anchor = document.createElement('div');
	anchor.innerHTML = goog.isDef(options.html) ? options.html : '';
	//anchor.innerHTML = '<span class="toolbar-button--quiet navigation-bar__line-height"><i class="ion-android-more" style="font-size:20px;"></i></span>';
	//anchor.innerHTML = '<span class="toolbar-button--quiet navigation-bar__line-height"><i class="ion-navicon" style="font-size:20px;"></i></span>';

	this.callback = opt_options.callback;
	var this_ = this;
	var onClick = function(e) {
		// prevent #rotate-north anchor from getting appended to the url
		e.preventDefault();
		this_.callback(e);
	};

	anchor.addEventListener('click', onClick, false);
	anchor.addEventListener('touchstart', onClick, false);

	var element = anchor;
	//var element = document.createElement('div');
	element.className = goog.isDef(options.className) ? options.className : '';
	//element.appendChild(anchor);

	ol.control.Control.call(this, {
		element: element,
		target: options.target
	});
};
ol.inherits(ol.control.ButtonControl, ol.control.Control);


ol.layer.WebgisTmsLayer = function(opt_options) {
	var options = goog.isDef(opt_options) ? opt_options : {};
	goog.base(this,  /** @type {olx.layer.LayerOptions} */ (options));
	this.setLayers(goog.isDef(options.layers) ? options.layers : []);
	this.tilesUrl = goog.isDef(options.tilesUrl) ? options.tilesUrl : '';
	this.legendUrl = goog.isDef(options.legendUrl) ? options.legendUrl : '';
	this.project = goog.isDef(options.project) ? options.project : '';
};
goog.inherits(ol.layer.WebgisTmsLayer, ol.layer.Tile);

ol.layer.WebgisTmsLayer.prototype.setLayers = function(layers) {
	// TODO sort layers
	var layers_names = [].concat(layers).reverse().join(",");
	this.getSource().layers = layers;
	//this.getSource().layersString = layers_names;
	//this.getSource().layersHash = CryptoJS.MD5(layers_names).toString();
	var url_template = "{mapcache_url}{hash}/{z}/{x}/{y}.png?PROJECT={project}&LAYERS={layers}"
			.replace('{mapcache_url}', this.tilesUrl)
			.replace('{hash}', CryptoJS.MD5(layers_names).toString())
			.replace('{project}', this.project)
			.replace('{layers}', layers_names);
	this.getSource().tileUrlTemplate = url_template;
	this.getSource().tileCache.clear();
	
	// update attributions
	if (this.layersAttributions) {
		var attributions = [];
		var attributions_html = [];
		layers.forEach(function(layername) {
			var attribution = this.layersAttributions[layername];
			if (attribution && attributions_html.indexOf(attribution.getHTML()) == -1) {
				attributions.push(attribution);
				attributions_html.push(attribution.getHTML());
			}
		}, this);
		this.getSource().setAttributions(attributions);
	}
	this.changed();
};

ol.layer.WebgisTmsLayer.prototype.getLegendUrls = function(view) {
	var layers_names = this.getSource().layers;
	var base_legend_url = this.legendUrl;
	var tile_grid = this.getSource().getTileGrid();
	var zoom_level = tile_grid.getZForResolution(view.getResolution());
	var base_params = {
		'SERVICE': 'WMS',
		'VERSION': '1.1.1',
		'REQUEST': 'GetLegendGraphic',
		'EXCEPTIONS': 'application/vnd.ogc.se_xml',
		'FORMAT': 'image/png',
		'SYMBOLHEIGHT': '4',
		'SYMBOLWIDTH': '6',
		'LAYERFONTSIZE': '10',
		'LAYERFONTBOLD': 'true',
		'ITEMFONTSIZE': '11',
		'ICONLABELSPACE': '6',
		'SCALE': Math.round(view.getScale()).toString(),
		'PROJECT': this.project,
	}
	var url_template = this.legendUrl + '{hash}/{zoom}.png'.replace('{zoom}', Number(zoom_level).toString());
	url_template = goog.uri.utils.appendParamsFromMap(url_template, base_params);
	var legends_urls = {};
	layers_names.forEach(function (layer_name) {
		var layer_hash = CryptoJS.MD5(layer_name).toString();
		var url = url_template.replace('{hash}', layer_hash);
		url = goog.uri.utils.appendParamsFromMap(url, {'LAYER': layer_name});
		legends_urls[layer_name] = url;
	});
	return legends_urls;
};

ol.layer.WebgisTmsLayer.prototype.setLayersAttributions = function(attributions) {
	this.layersAttributions = attributions;
}

ol.layer.WebgisWmsLayer = function(opt_options) {
	var options = goog.isDef(opt_options) ? opt_options : {};
	goog.base(this,  /** @type {olx.layer.LayerOptions} */ (options));
	this.setLayers(goog.isDef(options.layers) ? options.layers : []);
};
goog.inherits(ol.layer.WebgisWmsLayer, ol.layer.Image);
ol.layer.WebgisWmsLayer.prototype.setLayers = function(layers) {
	var layers_names = [].concat(layers).reverse().join(",");
	this.getSource().layers = layers;
	this.getSource().updateParams({LAYERS: layers_names});
};

ol.layer.WebgisWmsLayer.prototype.getLegendUrls = function(view) {
	var layers_names = this.getSource().layers;
	var params = {
		'SERVICE': 'WMS',
		'VERSION': '1.1.1',
		'REQUEST': 'GetLegendGraphic',
		'EXCEPTIONS': 'application/vnd.ogc.se_xml',
		'FORMAT': 'image/png',
		'SYMBOLHEIGHT': '4',
		'SYMBOLWIDTH': '6',
		'LAYERFONTSIZE': '10',
		'LAYERFONTBOLD': 'true',
		'ITEMFONTSIZE': '11',
		'ICONLABELSPACE': '6',
		'SCALE': Math.round(view.getScale()).toString()
	}
	var ows_url = this.getSource().getUrl();
	var legends_urls = {};
	layers_names.forEach(function (layer_name) {
		params['LAYER'] = layer_name;
		var url = goog.uri.utils.appendParamsFromMap(ows_url, params);
		legends_urls[layer_name] = url;
	});
	return legends_urls;
}


ol.Map.prototype.getLayer = function (type) {
	var layer;
	this.getLayers().forEach(function (l) {
		if (type == l.get('type')) {
			layer = l;
		}
	});
	return layer;
}

ol.View.prototype.getScale = function () {
	var resolution = this.getResolution();
	var units = this.getProjection().getUnits();
	var dpi = 25.4 / 0.28;
	var mpu = ol.proj.METERS_PER_UNIT[units];
	var scale = resolution * mpu * 39.37 * dpi;
	return scale;
}


webgis.layersTreeToList = function(layers_tree, skip_groups) {
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

webgis.createBaseLayer = function(config) {
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
		base_layer.set("type", "baselayer");
		base_layer.set("name", config.name);
	}
	return base_layer;
};


webgis.createMap = function(config) {
	// overlay layers
	if (config.layers) {
		var overlays_layer;
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
		overlays_layer.set("type", "qgislayer");
	}
	var layers = [];
	var base_layers_configs = webgis.layersTreeToList({layers: config.base_layers}, true);
	base_layers_configs.forEach(function(baselayer_config) {
		var base_layer = webgis.createBaseLayer(baselayer_config);
		if (base_layer) {
			layers.push(base_layer);
		}
	});

	layers.push(overlays_layer);
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

