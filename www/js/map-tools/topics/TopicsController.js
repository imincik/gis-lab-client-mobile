(function() {
	'use strict';

	angular
		.module('gl.topics')
		.controller('TopicsController', TopicsController);

	function TopicsController($scope, $timeout, projectProvider) {
		$scope.topics = projectProvider.config.topics;
		$scope.loadTopic = function(topic) {
			projectProvider.map.getLayer('qgislayer').setVisibleLayers(topic.visible_overlays);
		}
		$scope.isDetailShown = function(topic) {
			return $scope.shownTopic === topic;
		};
		$scope.toggleTopicDetail = function(topic) {
			if ($scope.isDetailShown(topic)) {
				$scope.shownTopic = null;
			} else {
				$scope.shownTopic = topic;
			}
		};
	};
})();
