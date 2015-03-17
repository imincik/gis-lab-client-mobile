(function() {
	'use strict';

	angular
		.module('gl.utils', [])
		.directive('glConAttr', glConAttr);

	function glConAttr() {
		return {
			restrict: 'A',
			link: function (scope, el, attrs) {
				var conditional_attributes = scope.$eval(attrs.glConAttr);
				for (var attr_name in conditional_attributes) {
					if (conditional_attributes[attr_name] === true) {
						attrs.$set(attr_name, '');
					}
				}
			}
		};
	};
})();
