//scope = angular.element($('[ng-controller=AppController]')).scope()

(function() {
	'use strict';

	var app = angular.module('app', ['onsen', 'ngTouch', 'ngStorage', 'ui.grid', 'ui.grid.edit', 'ivh.treeview']);
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
	app.config(['$httpProvider', function($httpProvider) {
		//$httpProvider.defaults.useXDomain = true;
		//delete $httpProvider.defaults.headers.common["X-Requested-With"];
	}]);
	app.controller('MapController', function($scope) {
		console.log('MapController');
		$scope.$parent.loadProject($scope.$storage.project);
	});

	app.controller('SettingsController', function($scope, $http) {
		console.log('SettingsController');
		var url = '{0}/projects.json'.format($scope.$storage.serverUrl);
		$http.get(url, {withCredentials: true}).
				success(function(data, status, headers, config) {
					console.log(data);
					if (data.length) {
						$scope.myProjects.length = 0;
						Array.prototype.push.apply($scope.myProjects, data);
					}
				}).
				error(function(data, status, headers, config) {
					console.log('error: '+status);
				});
	});

	app.controller('AppController', function($scope, $http, $localStorage) {
		$scope.mapInitialized = false;
		console.log("AppController");
		$scope.settings = {
			server_tab: 1,
			project_tab: '1'
		};
		$scope.$storage = $localStorage;
		$scope.myProjects = [];
		if ($scope.$storage.serverUrl) {
			$http.post('{0}/mobile/login/'.format($scope.$storage.serverUrl), {
					username: $scope.$storage.username,
					password: $scope.$storage.password
				}, {
					withCredentials: true
				}).
				success(function(data, status, headers, config) {
					console.log('login successful');
				}).
				error(function(data, status, headers, config) {
					console.log('login error');
				});
		}
		ons.ready(function() {
			console.log('ons ready');
			$scope.app.navigator.on('postpop', function(evt) {
				if (evt.enterPage.name == 'mainPage.html' && $scope.olMap.getSize()[0] == 0) {
					console.log('update size');
					$scope.olMap.updateSize();
				}
			});
		});

		$scope.mapWidth = document.body.clientWidth;
		$scope.mapHeight = document.body.clientHeight;
		$scope.panelHeight = document.body.clientHeight-45;
		$scope.baseLayer = {title: 'Select base layer'};
		$scope.setBaseLayer = function(layer) {
			console.log('setBaseLayer');
			console.log(layer);
			$scope.baseLayer = layer;
		};

		$scope.layers = {};
		$scope.layersList = [];

		$scope.layersVisibilityChanged = function(node) {
			var visible_layers = [];
			$scope.layersList.forEach(function(layer_data) {
				if (!layer_data.isGroup && layer_data.visible) {
					visible_layers.push(layer_data.name);
				}
			});
			//console.log(visible_layers);
			$scope.olMap.getLayer("qgislayer").setLayers(visible_layers);
		};

		$scope.loadProject = function(project) {
			console.log('loadProject '+project);
			$scope.$storage.project = project;
			var url = '{server}/mobile/config.json?PROJECT={project}'
				.replace('{server}', $scope.$storage.serverUrl)
				.replace('{project}', encodeURIComponent(project));
			$http.get(url).
				success(function(data, status, headers, config) {
					var controls = [
						new ol.control.ButtonControl({
							className: 'webgis-button panel',
							html: '<span class="toolbar-button--quiet navigation-bar__line-height"><i class="ion-navicon" style="font-size:20px;"></i></span>',
							callback: function(e) {
								$scope.$apply(function() {
									$scope.app.menu.toggleMenu();
								});
							}
						}),
						new ol.control.ButtonControl({
							className: 'webgis-button menu',
							html: '<span class="toolbar-button--quiet navigation-bar__line-height"><i class="ion-android-more" style="font-size:20px;"></i></span>',
							callback: function(e) {
								$scope.$apply(function() {
									$scope.app.menu2.toggleMenu();
								});
							}
						})
					];
					var webgis = angular.module('webgis');
					var olMap = webgis.createMap(data);
					if (olMap) {
						$scope.mapInitialized = true;
						if (!$scope.$storage.recentProjects) {
							$scope.$storage.recentProjects = [data.project];
						} else {
							var index = $scope.$storage.recentProjects.indexOf(data.project);
							if (index >= 0) {
								$scope.$storage.recentProjects.splice(index, 1);
							}
							/*
							while (index >= 0) {
								$scope.$storage.recentProjects.splice(index, 1);
								index = $scope.$storage.recentProjects.indexOf(data.project);
								console.log('remove');
							}*/
							$scope.$storage.recentProjects.splice(0, 0, data.project);
						}
						if ($scope.olMap) {
							$scope.olMap.dispose();
						}
						$scope.olMap = olMap;
						$scope.olMap.addControl(controls[0]);
						$scope.olMap.addControl(controls[1]);

						$scope.layers = data.layers;
						$scope.layersList = webgis.layersTreeToList({layers: $scope.layers});
						var attributions = {};
						$scope.layersList.forEach(function(layer_data) {
							var attribution = layer_data.attribution;
							if (attribution) {
								var attribution_html;
								if (attribution.url) {
									attribution_html = '<a href="{0}" target="_blank">{1}</a>'.format(attribution.url, attribution.title);
								} else {
									attribution_html = attribution.title;
								}
								attributions[layer_data.name] = new ol.Attribution({html: attribution_html});
							}
						});
						$scope.olMap.getLayer("qgislayer").setLayersAttributions(attributions);
						$scope.layersVisibilityChanged({});
						var legends_urls = $scope.olMap.getLayer("qgislayer").getLegendUrls($scope.olMap.getView());
						$scope.layersList.forEach(function(layer_data) {
							layer_data.legendUrl = legends_urls[layer_data.name];
						});

						var test_base_layers = [
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
						];
						//$scope.baseLayersList = webgis.layersTreeToList({layers: test_base_layers});
						$scope.baseLayersList = visit_baselayer([], {layers: data.base_layers});

						// Project info
						$scope.project = data;
					}
				}).
				error(function(data, status, headers, config) {
					console.log('error');
				});
		};


		$scope.watchID = null;

		// device APIs are available
		function onDeviceReady() {

			window.addEventListener('orientationchange', function() {
				$scope.panelHeight = document.body.clientHeight-45;
				$scope.mapWidth = document.body.clientWidth;
				$scope.mapHeight = document.body.clientHeight;
				$scope.$apply();
				$scope.olMap.updateSize();
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
