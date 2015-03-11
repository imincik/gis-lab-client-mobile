angular.module('utils', [])
	.directive('ngConAttr', function () {
		return {
			restrict: 'A',
			link: function (scope, el, attrs) {
				var conditional_attributes = scope.$eval(attrs.ngConAttr);
				for (attr_name in conditional_attributes) {
					if (conditional_attributes[attr_name] === true) {
						attrs.$set(attr_name, '');
					}
				}
			}
		};
	});
