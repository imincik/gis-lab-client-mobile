(function() {
	'use strict';

	angular
		.module('gl.mobile')
		.controller('MobileAppController', MobileAppController);

	function MobileAppController($scope, $localStorage, gislabMobileClient, projectProvider, layersControl, locationService, TabbarView, TabbarSlideAnimator) {
		console.log("MobileAppController");
		TabbarView.registerAnimator('slide', new TabbarSlideAnimator());
		$scope.baseLayers = {selected: {}};
		$scope.$storage = $localStorage;

		$scope.ui = {
			tools_layers_tab: 0,
			settings_server_tab: 0,
			settings_project_tab: 0
		};
		$scope.ui.toolbar = [
			{
				icon: 'ion-images',
				page: 'pages/tools/topics.html',
				persistent: true,
			}, {
				icon: 'ion-social-buffer',
				page: 'pages/tools/layers.html',
				persistent: true,
				activate: function() {
					console.log('layers activated');
					layersControl.activate();
				}
			}, {
				icon: 'ion-qr-scanner',
				toggle: false,
				callback: function() {
					var map = projectProvider.map;
					var pan = ol.animation.pan({
						duration: 300,
						source: map.getView().getCenter()
					});
					var zoom = ol.animation.zoom({
						duration: 300,
						resolution: map.getView().getResolution()
					});
					map.beforeRender(pan, zoom);
					projectProvider.map.getView().fitExtent(projectProvider.config.project_extent, projectProvider.map.getSize());
				}
			}, {
				icon: 'ion-location',
				//toggle: true,
				toggle: false,
				callback: function() {
					console.log(this);
					if (this.icon === 'ion-android-locate') {
						this.activated = false;
						this.icon = 'ion-location';
						locationService.deactivate(projectProvider.map);
					} else {
						if (!this.activated) {
							this.activated = true;
							locationService.setAutoPan(false);
							locationService.activate(projectProvider.map);
						} else {
							this.icon = 'ion-android-locate';
							locationService.setAutoPan(true);
						}
					}
				}
			}, {
				icon: 'ion-search'
			}, {
				icon: 'ion-information-circled'
			}, {
				faIcon:'fa-expand'
			}, {
				icon: 'ion-edit',
				page: 'pages/tools/drawings.html',
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
					var animation = $scope.app.menu.isMenuOpened()? 'slide' : 'none';
					if (tool.activate) {
						tool.activate();
					}
					$scope.app.panel.tabbar.setActiveTab(tool._tab_index, {animation: animation});
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
		};

		ons.ready(function() {
			console.log('ons ready');
			setImmediate(function() {
				console.log($scope.app.menu);
				$scope.app.menu.on('preclose', function() {
					console.log('close menu');
				});
			});
			$scope.app.navigator.on('postpop', function(evt) {
				if (evt.leavePage.page === 'pages/settings/main.html' && projectProvider.map && projectProvider.map.getSize()[0] === 0) {
					projectProvider.map.updateSize();
				}
			});

			$scope.updateScreenSize();
			if ($scope.$storage.project) {
				if ($scope.$storage.serverUrl && $scope.$storage.username) {
					gislabMobileClient.login($scope.$storage.serverUrl, $scope.$storage.username, $scope.$storage.password)
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
		});

		$scope.updateScreenSize = function() {
			$scope.panelHeight = document.body.clientHeight-36;
			$scope.mapWidth = document.body.clientWidth;
			$scope.mapHeight = document.body.clientHeight;
		};

		$scope.loadProject = function(projectName) {
			console.log('loadProject '+projectName);
			$scope.$storage.project = projectName;

			//$scope.app.menu.setMenuPage('panel_tab_container.html');
			/*
			if ($scope.app.panel.tabbar._scope) {
				setImmediate(function() {
					$scope.app.panel.tabbar.setActiveTab($scope.ui.toolbar[$scope.ui.toolbar.length-1]._tab_index);
				});
			}*/
			//$scope.app.menu.setMainPage('map.html');
			gislabMobileClient.project($scope.$storage.serverUrl, projectName)
				.success(function(data, status, headers, config) {
					data.target = 'map';
					projectProvider.load(data);
					if (projectProvider.map) {
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
						// Project info
						$scope.project = projectProvider.config;
					}
				})
				.error(function(data, status, headers, config) {
					console.log('error');
				});
		};


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
				if (projectProvider.map) {
					projectProvider.map.updateSize();
				}
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

		};
		function onPause() {
			console.log("--------PAUSE--------");

		}
		console.log('register deviceready');
		document.addEventListener("deviceready", onDeviceReady, false);
	};
})();
