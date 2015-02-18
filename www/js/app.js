//scope = angular.element($('[ng-controller=AppController]')).scope()

(function() {
	'use strict';

	var app = angular.module('app', ['onsen', 'ngTouch', 'ui.grid', 'ui.grid.edit', 'ivh.treeview']);

	app.config(function(ivhTreeviewOptionsProvider) {
		ivhTreeviewOptionsProvider.set({
			idAttribute: 'id',
			labelAttribute: 'title',
			childrenAttribute: 'layers',
			selectedAttribute: 'visible',
			useCheckboxes: true,
			expandToDepth: 0,
			indeterminateAttribute: '__ivhTreeviewIndeterminate',
			defaultSelectedState: true,
			validate: true,
			twistieExpandedTpl: '<i class="fa fa-minus-square"></i>',
			twistieCollapsedTpl: '<i class="fa fa-plus-square"></i>',
			twistieLeafTpl: '<div class="{{ node.geom_type | lowercase }}-layer-icon"></div>',
			//checkBoxTpl: '<p>x</p>'
		});
	});
	app.controller('MapController', function($scope, $timeout) {
		$scope.init = function() {
			var webgis = angular.module('webgis');
			var controls = [
				new ol.control.ButtonControl({
					className: 'webgis-button panel',
					callback: function(e) {
						$scope.$parent.$apply(function() {
							$scope.app.menu.toggleMenu();
						});
					}
				}),
				new ol.control.ButtonControl({
					className: 'webgis-button menu',
					callback: function(e) {
						$scope.$parent.$apply(function() {
							$scope.app.menu2.toggleMenu();
						});
					}
				})
			];
			$scope.$parent.setMap(webgis.initMap(controls));
			$scope.$parent.layersVisibilityChanged({});
			var legends_urls = $scope.olMap.getLayer("qgislayer").getLegendUrls($scope.olMap.getView());
			$scope.flat_layers.forEach(function(layer_data) {
				layer_data.legendUrl = legends_urls[layer_data.name];
			});
		};
		console.log("MapController");
		//$timeout( function(){ $scope.init(); }, 100);
		$scope.init();

	});
	app.controller('AppController', function($scope, $timeout) {
		console.log("AppController");
		$scope.mapWidth = document.body.clientWidth;
		$scope.mapHeight = document.body.clientHeight;
		$scope.panelHeight = document.body.clientHeight-45;
		$scope.baseLayer = {title: 'Select base layer'};
		$scope.setBaseLayer = function(layer) {
			console.log('setBaseLayer');
			console.log(layer);
			$scope.baseLayer = layer;
		};

		var webgis = angular.module('webgis');
		$scope.setMap = function(map) {
			$scope.olMap = map;
		};

		$scope.watchID = null;

		// device APIs are available
		//
		function onDeviceReady() {

			window.addEventListener('orientationchange', function() {
				$scope.panelHeight = document.body.clientHeight-45;
				$scope.mapWidth = document.body.clientWidth;
				$scope.mapHeight = document.body.clientHeight;
				$scope.$apply();
			});
			document.addEventListener("pause", onPause, false);
			document.addEventListener("resume", function() {
				/*
				console.log("--------RESUMED--------");
				navigator.notification.alert(
					"I'm Back!",
					function() {},
					"But Why?!"
				);*/
			}, false);
			
			// Throw an error if no update is received every 30 seconds
			function successHandler(position) {
				//console.log(position);
				$scope.position = position;
				$scope.position.text = position.coords.latitude+', '+position.coords.longitude;
				$scope.$apply();
			}
			function errorHandler(error) {
				console.log(error);
				$scope.error = error;
				$scope.$apply();
			}
			var options = {
				timeout: 20000,
				enableHighAccuracy: true
			};
			//navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);
			//$scope.watchID = navigator.geolocation.watchPosition(successHandler, errorHandler, options);
		}
		function onPause() {
			console.log("--------PAUSE--------");
			if ($scope.watchID) {
				console.log("--------stopping GPS--------");
				navigator.geolocation.clearWatch($scope.watchID);
			}
		}
		document.addEventListener("deviceready", onDeviceReady, false);

		$scope.layers = webgis.layers;
		// create flat list of overlay layers
		var visit_layer = function(layers, layer_data) {
			layer_data.title = layer_data.title? layer_data.title : layer_data.name;
			//layer_data.title += ' abcd efghij klmn';
			if (layer_data.layers) {
				layer_data.layers.forEach(function(sublayer_data) {
					visit_layer(layers, sublayer_data);
				});
			} else if (layer_data) {
				layer_data.legendUrl = '';
				layers.push(layer_data);
			}
			return layers;
		};
		$scope.flat_layers = visit_layer([], {layers: $scope.layers});

		var visit_baselayer = function(layers, layer_data, depth) {
			if (!depth) {
				depth = 0;
			}
			layer_data.depth = depth;
			if (layer_data.layers) {
				if (layer_data.title) {
					layer_data.isGroup = true;
					layers.push(layer_data);
				}
				layer_data.layers.forEach(function(sublayer_data) {
					visit_baselayer(layers, sublayer_data, depth+1);
				});
			} else if (layer_data) {
				layer_data.isGroup = false;
				layers.push(layer_data);
			}
			return layers;
		};
		/*
		webgis.baseLayers = [
			{title: 'First'},
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
						]
					}
				]
			},
			
			{title: 'Third'},
		];*/
		$scope.baseLayers = visit_baselayer([], {layers: webgis.baseLayers});
		
		$scope.layersVisibilityChanged = function(node) {
			var visible_layers = [];
			$scope.flat_layers.forEach(function(layer_data) {
				if (layer_data.visible) {
					visible_layers.push(layer_data.name);
				}
			});
			//console.log(visible_layers);
			$scope.olMap.getLayer("qgislayer").setLayers(visible_layers);
		};
		
		$scope.getLegendUrl = function(layer) {
			return $scope.olMap.getLayer("qgislayer").getLegendUrls($scope.olMap.getView())[layer.name];
		};

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

})();
