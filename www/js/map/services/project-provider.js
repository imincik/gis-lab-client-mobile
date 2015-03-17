(function() {
	'use strict';

	angular
		.module('gl.map')
		.factory('projectProvider', [function() {
			return {
				map: null,
				config: {}
			}
		}]);
})();
