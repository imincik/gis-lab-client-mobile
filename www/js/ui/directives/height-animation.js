(function() {
	'use strict';

	angular
	.module('gl.ui')
	.animation('.height-anim', function() {
		return {
			beforeAddClass : function(element, className, done) {
				var height = element[0].scrollHeight;
				element.css('height', '{0}px'.format(height));
				done();
			},
		};
	})
	.directive('glHeightAnimation', glHeightAnimation)
	.directive('glFixedHeight', glFixedHeight);

	function glHeightAnimation() {
		return {
			restrict: 'A',
			controller: ['$scope', '$animate', function($scope, $animate) {
				$scope.setup = function(visibilityModel, iElem) {
					$scope.$watch(visibilityModel, function(visible) {
						if (visible) {
							$animate.removeClass(iElem, 'height-anim').then(function() {
								iElem.css('height', 'auto');
							});
						} else {
							$animate.addClass(iElem, 'height-anim');
						}
					});
				};
			}],
			link: function(scope, iElem, iAttrs, ctrl) {
				var visibilityModel = iAttrs.glHeightAnimation || iAttrs.ngShow || iAttrs.ngIf;
				scope.setup(visibilityModel, iElem);
			}
		};
	};

	function glFixedHeight($timeout) {
		return {
			restrict: 'A',
			compile: function(tElem, tAttrs) {
				tElem[0].setAttribute('style', 'display: block!important;visibility: hidden!important;');
				return {
					post: function(scope, iElem, iAttrs) {
						$timeout(function() {
							var height = iElem[0].scrollHeight;
							iElem[0].setAttribute('style', 'height: {0}px;'.format(height));
						});
					}
				}
			}
		};
	};
})();
