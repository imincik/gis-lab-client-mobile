angular.module('gl.map', []);

goog.provide('ol.control.ButtonControl');
goog.provide('ol.layer.WebgisTmsLayer');
goog.provide('ol.layer.WebgisWmsLayer');
goog.require('ol.control.Control');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Image');


ol.layer.WebgisTmsLayer = function(opt_options) {
	var options = goog.isDef(opt_options) ? opt_options : {};
	goog.base(this,  /** @type {olx.layer.LayerOptions} */ (options));
	this.setVisibleLayers(goog.isDef(options.visible_layers) ? options.visible_layers : []);
	this.tilesUrl = goog.isDef(options.tilesUrl) ? options.tilesUrl : '';
	this.legendUrl = goog.isDef(options.legendUrl) ? options.legendUrl : '';
	this.project = goog.isDef(options.project) ? options.project : '';
};
goog.inherits(ol.layer.WebgisTmsLayer, ol.layer.Tile);

ol.layer.WebgisTmsLayer.prototype.setVisibleLayers = function(layers) {
	if (layers == this.getSource().layers) {
		return;
	}
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

ol.layer.WebgisTmsLayer.prototype.getVisibleLayers = function() {
	return this.getSource().layers;
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
	this.setVisibleLayers(goog.isDef(options.visible_layers) ? options.visible_layers : []);
};
goog.inherits(ol.layer.WebgisWmsLayer, ol.layer.Image);
ol.layer.WebgisWmsLayer.prototype.setVisibleLayers = function(layers) {
	if (layers == this.getSource().layers) {
		return;
	}
	var layers_names = [].concat(layers).reverse().join(",");
	this.getSource().layers = layers;
	this.getSource().updateParams({LAYERS: layers_names});
};

ol.layer.WebgisWmsLayer.prototype.getVisibleLayers = function() {
	return this.getSource().layers;
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
};


ol.Map.prototype.getLayer = function (name) {
	var layer;
	this.getLayers().forEach(function (l) {
		if (name == l.get('name')) {
			layer = l;
		}
	});
	return layer;
};

ol.View.prototype.getScale = function () {
	var resolution = this.getResolution();
	var units = this.getProjection().getUnits();
	var dpi = 25.4 / 0.28;
	var mpu = ol.proj.METERS_PER_UNIT[units];
	var scale = resolution * mpu * 39.37 * dpi;
	return scale;
};
