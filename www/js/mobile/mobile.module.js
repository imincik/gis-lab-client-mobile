(function() {
	'use strict';

	angular
		.module('gl.mobile', ['onsen', 'ngTouch', 'ngStorage', 'gl.ui', 'gl.utils', 'gl.map', 'gl.layersControl', 'gl.drawings'])
		.config(['$httpProvider', function($httpProvider) {
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
})();
