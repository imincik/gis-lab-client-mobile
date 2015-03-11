angular.module('app')
	.directive('ngTabModel', function() {
		return {
			controller: function($scope) {}
		}
	})
	.directive('ngCarouselVar', function() {
		return {
			controller: function($scope) {}
		}
	})
	.directive('ngCarouselTabSlider', function() {
		return {
			restrict: 'E',
			require: ['ngTabModel' ,'ngCarouselVar'],
			template: '<div class="carousel-slider-bg"><div class="carousel-slider"></div></div>',
			replace: true,
			scope: true,
			transclude: false,
			controller: ['$scope', '$timeout', '$parse', function($scope, $timeout, $parse) {
				$scope.setupSlider = function(carousel, slider, model) {
					
					var items_count = carousel._getCarouselItemCount();
					var model_setter = $parse(model).assign;
					$scope.$watch(model, function(value) {
						carousel.setActiveCarouselItemIndex(value);
					});

					var slider_width = '{0}%'.format(100.0/items_count);
					slider.setAttribute("style", "width: {width};".replace('{width}', slider_width));
					var noanim_template = "width: {width};\
						transform: translate3d({0}px, 0px, 0px);\
						-webkit-transform: translate3d({0}px, 0px, 0px);\
						-webkit-transition: all 0 ease 0".replace('{width}', slider_width);
					var anim_template = "width: {width};\
						transform: translate3d({0}px, 0px, 0px);\
						-webkit-transform: translate3d({0}px, 0px, 0px);\
						-webkit-transition: all 0.3s cubic-bezier(0.1, 0.7, 0.1, 1) 0s".replace('{width}', slider_width);
					carousel.on('postchange', function(e) {
						$timeout(function() {
							model_setter($scope, e.activeIndex);
						}, 0);
						var x = carousel._scroll/items_count;
						var style = anim_template.format(x);
						slider.setAttribute("style", style);
					});

					carousel._hammer.on('drag', function(e) {
						var scroll = carousel._getScrollDelta(e);
						var x = (carousel._scroll-scroll)/items_count;
						var style = noanim_template.format(x);
						slider.setAttribute("style", style);
					});

					carousel._hammer.on('dragend', function(e) {
						var x = carousel._scroll/items_count;
						var style = anim_template.format(x);
						slider.setAttribute("style", style);
					});
				}
			}],
			link: function(scope, iElement, iAttrs, ctrl) {
				setImmediate(function() {
					var carousel = scope.$eval(iAttrs.ngCarouselVar);
					scope.setupSlider(carousel, iElement[0].children[0], iAttrs.ngTabModel);
				});
			}
	}});
