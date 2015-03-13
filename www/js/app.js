//scope = angular.element($('[ng-controller=AppController]')).scope()

(function() {
	'use strict';

	var app = angular.module('app', ['utils', 'services', 'onsen', 'ngTouch', 'ngStorage', 'ui.grid', 'ui.grid.edit', 'ivh.treeview']);
	app.config(function(ivhTreeviewOptionsProvider) {
		ivhTreeviewOptionsProvider.set({
			idAttribute: 'id',
			labelAttribute: 'title',
			childrenAttribute: 'layers',
			selectedAttribute: 'visible',
			indeterminateAttribute: '__indeterminate',
			twistieExpandedTpl: '<i class="fa fa-minus-square"></i>',
			twistieCollapsedTpl: '<i class="fa fa-plus-square"></i>',
		});
	});
	app.config(['$httpProvider', function($httpProvider) {
		// Intercept POST requests, convert to standard form encoding
		$httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
		$httpProvider.defaults.transformRequest.unshift(function (data) {
			var key, result = [];
			for (key in data) {
				if (data.hasOwnProperty(key)) {
					result.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
				}
			}
			return result.join("&");
		});
	}]);

	app.controller('LayersPanelController', function($scope, $timeout) {
		$scope.ui.tabs.layers = 0;
		$scope.baseLayers.treeOptions = {
			expandToDepth: -1,
			useCheckboxes: false,
			twistieLeafTpl:
				'<label class="radio-button">\
					<input type="radio" name="baselayer-radio" value="{{ node.name }}" ng-model="node.selected.name"></input>\
					<div class="radio-button__icon-checkmark"></div>\
				</label>',
		};
		$scope.layers.treeOptions = {
			expandToDepth: -1,
			useCheckboxes: true,
			validate: true,
			twistieLeafTpl: '<span class="{{ node.geom_type | lowercase }}-layer-icon"></span>',
		};
	});
	app.controller('SettingsController', function($scope, WebGIS) {
		console.log('SettingsController');
		$scope.ui.tabs.server = 0;
		$scope.ui.tabs.project = 0;
	});
	app.controller('ProjectSettingsController', function($scope, WebGIS) {
		WebGIS.userProjects($scope.$storage.serverUrl)
				.success(function(data, status, headers, config) {
					if (angular.isArray(data)) {
						$scope.project.myProjects = data;
					}
				})
				.error(function(data, status, headers, config) {
					console.log('error: '+status);
				});
	});
	app.controller('AppController', function($scope, $localStorage, WebGIS) {
		console.log("AppController");
		$scope.ui = {
			tabs: {}
		};
		$scope.baseLayers = {selected: {}};
		$scope.layers = {};
		$scope.project = {};
		$scope.$storage = $localStorage;

		$scope.ui.toolbar = [
			{
				icon: 'ion-images'
			}, {
				icon: 'ion-social-buffer',
				page: 'pages/layers_panel.html',
				persistent: true,
			}, {
				icon: 'ion-qr-scanner',
				toggle: false,
				callback: function() {
					$scope.olMap.getView().fitExtent($scope.project.project_extent, $scope.olMap.getSize());
				}
			}, {
				icon: 'ion-location',
				toggle: true,
			}, {
				icon: 'ion-search'
			}, {
				icon: 'ion-information-circled'
			}, {
				faIcon:'fa-expand'
			}, {
				icon: 'ion-edit',
				page: 'grid.html',
				persistent: true,
			}, {
				icon: 'ion-gear-b',
				page: 'menu.html'
			}
		];

		$scope.toolTaped = function(tool) {
			//console.log(tool);
			if (tool.page) {
				if (!tool.activated) {
					var switchTool = false;
					$scope.ui.toolbar.forEach(function(item) {
						if (item.page && item.activated) {
							item.activated = false;
							switchTool = true;
						}
					});
					$scope.app.panel.tabbar.setActiveTab(tool._tab_index);
					if (!switchTool) {
						$scope.app.menu.openMenu({autoCloseDisabled: true});
					}
				} else {
					$scope.app.menu.closeMenu();
				}
				//$scope.app.menu.toggleMenu();
				tool.activated = !tool.activated;
			} else if (!tool.toggle) {
				if (tool.callback) {
					tool.callback();
				}
			} else {
				tool.activated = !tool.activated;
			}
		}

		ons.ready(function() {
			console.log('ons ready');
			$scope.updateScreenSize();
			if ($scope.$storage.project) {
				if ($scope.$storage.serverUrl && $scope.$storage.username) {
					WebGIS.login($scope.$storage.serverUrl, $scope.$storage.username, $scope.$storage.password)
						.then(function(data) {
							$scope.loadProject($scope.$storage.project);
						}, function(error) {
							console.log('ERROR');
							ons.notification.alert({
								message: 'Failed to login'
							});
							$scope.loadProject($scope.$storage.project);
						});
				} else {
					// try as guest user
					$scope.loadProject($scope.$storage.project);
				}
			} else {
				ons.notification.alert({
					message: 'No project is configured'
				});
			}
			/*
			$scope.app.navigator.on('postpop', function(evt) {
				if (evt.enterPage.name == 'main_page.html' && $scope.olMap.getSize()[0] == 0) {
					console.log('update size');
					$scope.olMap.updateSize();
				}
			});*/
		});

		$scope.updateScreenSize = function() {
			$scope.panelHeight = document.body.clientHeight-36;
			$scope.mapWidth = document.body.clientWidth;
			$scope.mapHeight = document.body.clientHeight;

		};

		$scope.setBaseLayer = function(layername) {
			if (!$scope.olMap) return;
			$scope.olMap.getLayers().forEach(function (layer) {
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
			$scope.olMap.getLayer('qgislayer').setLayers(visible_layers);
		};

		$scope.loadProject = function(project) {
			console.log('loadProject '+project);
			$scope.$storage.project = project;
			WebGIS.project($scope.$storage.serverUrl, project)
				.success(function(data, status, headers, config) {
					var webgis = angular.module('webgis');
					data.target = 'map';
					var olMap = webgis.createMap(data);
					if (olMap) {
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

						$scope.layers.tree = data.layers;
						$scope.layers.list = webgis.layersTreeToList({layers: $scope.layers.tree});
						var attributions = {};
						$scope.layers.list.forEach(function(layer_data) {
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
						$scope.olMap.getLayer('qgislayer').setLayersAttributions(attributions);
						$scope.layersVisibilityChanged({});
						var legends_urls = $scope.olMap.getLayer('qgislayer').getLegendUrls($scope.olMap.getView());
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
						$scope.baseLayers.tree = data.base_layers;
						$scope.baseLayers.list = webgis.layersTreeToList({layers: $scope.baseLayers.tree});
						$scope.baseLayers.list.forEach(function(base_layer) {
							base_layer.selected = $scope.baseLayers.selected;
							if (base_layer.visible) {
								$scope.baseLayers.selected.name = base_layer.name;
							}
						});

						// Project info
						$scope.project = data;
					}
				})
				.error(function(data, status, headers, config) {
					console.log('error');
				});
		};


		$scope.watchID = null;

		// device APIs are available
		function onDeviceReady() {
			setTimeout(function() {
				navigator.splashscreen.hide();
			}, 200);
			ons.setDefaultDeviceBackButtonListener(function() {
				ons.notification.confirm({
					message: 'Are you sure to close the app?',
					callback: function(index) {
						if (index === 1) { // OK button
							navigator.app.exitApp(); // Close the app
						}
					}
				});
			});

			window.addEventListener('orientationchange', function() {
				$scope.updateScreenSize();
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
