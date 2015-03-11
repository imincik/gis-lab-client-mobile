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
			useCheckboxes: true,
			expandToDepth: 0,
			indeterminateAttribute: '__indeterminate',
			defaultSelectedState: true,
			validate: true,
			twistieExpandedTpl: '<i class="fa fa-minus-square"></i>',
			twistieCollapsedTpl: '<i class="fa fa-plus-square"></i>',
			//twistieLeafTpl: '<div class="{{ node.geom_type | lowercase }}-layer-icon"></div>',
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

	app.controller('MapController', function($scope, $timeout) {
		console.log('MapController');
		$scope.setupScrollIndicator = function() {
			console.log('setupScrollIndicator');
			/*
			$scope.$parent.$watch('mapHeight', function(value) {
				console.log('mapHeight '+value);
				$timeout(function() {
					$scope.updateScrollIndicator();
				}, 100);
			})
			$scope.updateScrollIndicator();
			*/
		};
	});

	app.controller('PanelController', function($scope, $timeout) {
		//console.log('PanelController');
		$scope.ui = {panel_tab: 0};
		$scope.baseLayersTreeOptions = {
			useCheckboxes: false,
			//labelAttribute: '',
			twistieLeafTpl: '<label class="radio-button"><input type="radio" name="a"><div class="radio-button__icon-checkmark"></div></label>',
			//twistieLeafTpl: '<span class="point-layer-icon"></span>',
			//twistieLeafTpl: '<div><label class="radio-button"><input type="radio" name="a"><ons-icon class="radio-button__icon-checkmark" size="28px" fixed-width="true"></ons-icon></label></div>',
			//twistieLeafTpl: '<div><label class="radio-button"><input type="radio" name="a"><ons-icon icon="ion-android-radio-button-on" size="28px" fixed-width="true"></ons-icon></label></div>',
		};
		$scope.layersTreeOptions = {
			useCheckboxes: true,
			twistieLeafTpl: '<span class="{{ node.geom_type | lowercase }}-layer-icon"></span>',
		};
	});

	app.controller('SettingsController', function($scope, WebGIS) {
		console.log('SettingsController');
		WebGIS.userProjects($scope.$storage.serverUrl)
				.success(function(data, status, headers, config) {
					console.log(data);
					if (angular.isArray(data) && data.length) {
						$scope.myProjects.length = 0;
						Array.prototype.push.apply($scope.myProjects, data);
					}
				})
				.error(function(data, status, headers, config) {
					console.log('error: '+status);
				});
	});

	app.controller('AppController', function($scope, $localStorage, WebGIS) {
		$scope.mapInitialized = false;
		console.log("AppController");
		$scope.settings = {
			server_tab: 1,
			project_tab: '1'
		};
		$scope.$storage = $localStorage;
		$scope.myProjects = [];

		$scope.toolbar = [
			{
				icon: 'ion-images'
			}, {
				icon: 'ion-social-buffer',
				page: 'pages/panel.html',
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
		
		$scope.xtoolTaped = function(tool) {
			console.log(tool);
			if (tool.page) {
				if (!tool.activated) {
					var switchTool = false;
					$scope.toolbar.forEach(function(item) {
						if (item.page && item.activated) {
							item.activated = false;
							switchTool = true;
						}
					});
					if ($scope.app.panel.navigator.getCurrentPage().page != tool.page) {
						var options = {animation: 'none'};
						if ($scope.app.menu.isMenuOpened()) {
							options.animation = 'slide';
						}
						$scope.app.panel.navigator.resetToPage(tool.page, options);
					}
					if (!switchTool) {
						$scope.app.menu.openMenu({autoCloseDisabled: true});
					}
				} else {
					$scope.app.menu.closeMenu();
				}
				//$scope.app.menu.toggleMenu();
				tool.activated = !tool.activated;
			}
		}

		$scope.toolTaped = function(tool) {
			//console.log(tool);
			if (tool.page) {
				if (!tool.activated) {
					var switchTool = false;
					$scope.toolbar.forEach(function(item) {
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
			//return;
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
			$scope.screenWidth = document.body.clientWidth;
			$scope.screenHeight = document.body.clientHeight;
			$scope.panelHeight = document.body.clientHeight-40;
			$scope.mapWidth = document.body.clientWidth;
			$scope.mapHeight = document.body.clientHeight;
			/*
			switch (window.orientation) {
				case 0: // Portrait Mode
					break;
				case 90: // Landscape Mode
					break;
				default:
			}*/
		};

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
			WebGIS.project($scope.$storage.serverUrl, project)
				.success(function(data, status, headers, config) {
					var controls = [
						new ol.control.ButtonControl({
							className: 'webgis-button panel',
							html: '<span class="toolbar-button--quiet navigation-bar__line-height"><i class="ion-navicon" style="font-size:20px;"></i></span>',
							callback: function(e) {
								$scope.$apply(function() {
									$scope.app.menu.toggleMenu({autoCloseDisabled: true});
								});
							}
						}),
						new ol.control.ButtonControl({
							className: 'webgis-button menu',
							html: '<span class="toolbar-button--quiet navigation-bar__line-height"><i class="ion-navicon" style="font-size:20px;"></i></span>',
							callback: function(e) {
								$scope.$apply(function() {
									$scope.app.menu2.toggleMenu();
								});
							}
						})
					];
					var webgis = angular.module('webgis');
					data.target = 'map';
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
						//$scope.olMap.addControl(controls[0]);
						//$scope.olMap.addControl(controls[1]);

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
						//$scope.baseLayers = test_base_layers;
						$scope.baseLayers = data.base_layers;
						$scope.baseLayersList = webgis.layersTreeToList({layers: $scope.baseLayers});

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
