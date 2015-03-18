(function() {
	'use strict';

	angular
		.module('gl.mobile')
		.controller('MobileAppController', MobileAppController);

	function MobileAppController($scope, $localStorage, gislabMobileClient, projectProvider, layersControl, TabbarView, TabbarSlideAnimator) {
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
				icon: 'ion-images'
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
					projectProvider.map.getView().fitExtent(projectProvider.config.project_extent, projectProvider.map.getSize());
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
		};
		function onPause() {
			console.log("--------PAUSE--------");
			if ($scope.watchID) {
				console.log("--------stopping GPS--------");
				navigator.geolocation.clearWatch($scope.watchID);
			}
		}
		console.log('register deviceready');
		document.addEventListener("deviceready", onDeviceReady, false);
	};
})();
