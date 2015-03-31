(function() {
	'use strict';

	angular
		.module('gl.utils')
		.directive('glClick', glClick);

	function glClick($parse) {
		return {
			compile: function(elem, attr) {
				var clickHandler = $parse(attr.glClick);
				return function(scope, elem) {
					post: {
						elem.on('click', function(event) {
							scope.$apply(function() {
								clickHandler(scope, {$event: event});
							});
						});
					}
				};
			}
		};
	};
})();
