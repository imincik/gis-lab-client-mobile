(function() {
	'use strict';

	angular
	.module('gl.ui')
	.directive('glTreeView', glTreeView)
	.directive('glTreeNode', glTreeNode)
	.directive('glCheckTreeView', glCheckTreeView)
	.directive('glCheckTreeNode', glCheckTreeNode)
	.directive('glTreeGroupTemplate', glTreeGroupTemplate)
	.directive('glTreeLeafTemplate', glTreeLeafTemplate);

	function glTreeView($parse) {
		return {
			restrict: 'A',
			scope: {
				root: '=glTreeView',
				labelAttribute: '@glTreeLabelAttribute',
				childrenAttribute: '@glTreeChildrenAttribute',
				changeHandler: '&glTreeViewChangeHandler'
			},
			transclude: true,
			link: function(scope, iElem, iAttrs, ctrl, transclude) {
				transclude(scope, function(clone) {
					iElem.append(clone);
				});
			},
			controller: ['$scope', function($scope) {
				$scope.treeDepth = 0;
				$scope.isGroup = function(node) {
					return node.hasOwnProperty($scope.childrenAttribute);
				};
				$scope.children = function(node) {
					return node[$scope.childrenAttribute];
				};
			}]
		}
	}

	function glCheckTreeView() {
		return {
			restrict: 'A',
			scope: {
				root: '=glCheckTreeView',
				selectAttribute: '@glTreeSelectedAttribute',
				childrenAttribute: '@glTreeChildrenAttribute',
				changeHandler: '&glTreeViewChangeHandler'
			},
			transclude: true,
			link: function(scope, iElem, iAttrs, ctrl, transclude) {
				transclude(scope, function(clone) {
					iElem.append(clone);
				});
				scope.updateGroupsCheckState();
			},
			controller: ['$scope', '$timeout', function($scope, $timeout) {
				$scope.treeDepth = 0;
				$scope.isGroup = function(node) {
					return node.hasOwnProperty($scope.childrenAttribute);
				};
				$scope.children = function(node) {
					return node[$scope.childrenAttribute];
				};
				$scope.selectAll = function(node, isSelected) {
					$scope.children(node).forEach(function(child) {
						if ($scope.isGroup(child)) {
							$scope.selectAll(child, isSelected);
							$scope.setGroupCheckState(child, isSelected);
						}
						child[$scope.selectAttribute] = isSelected;
					});
				};
				$scope.nodeSelected = function(node, isSelected) {
					if ($scope.isGroup(node)) {
						$scope.selectAll(node, isSelected);
					}
					$scope.updateParentCheckState(node);
					$scope.changeHandler({node: node});
				};
				$scope.groupCheckState = function(node) {
					var allChecked = true;
					var allUnchecked = true;
					$scope.children(node).forEach(function(child) {
						if (child[$scope.selectAttribute] !== true) {
							allChecked = false;
						}
						if (child[$scope.selectAttribute] !== false) {
							allUnchecked = false;
						}
					});
					return allChecked? true : allUnchecked? false : null;
				};
				$scope.setGroupCheckState = function(node, isSelected) {
					node._checkboxElement.prop('indeterminate', isSelected === null);
					node[$scope.selectAttribute] = isSelected;
				}
				$scope.updateParentCheckState = function(node) {
					var n = node;
					while(n._parent) {
						n = n._parent;
						$scope.setGroupCheckState(n, $scope.groupCheckState(n));
					}
				};
				$scope.updateGroupsCheckState = function() {
					$timeout(function() {
						var fn = function(layers) {
							layers.forEach(function(node) {
								var children = $scope.children(node);
								if (children) {
									fn(children);
									$scope.setGroupCheckState(node, $scope.groupCheckState(node));
								}
							});
						}
						fn($scope.root);
					});
				};
				$scope.root.updateGroupsCheckState = $scope.updateGroupsCheckState;
			}]
		}
	}

	function glTreeNode() {
		return {
			restrict: 'A',
			scope: true,
			transclude: true,
			controller: ['$scope', '$compile', '$element', function($scope, $compile, $element) {
				$scope.nodeSelected = function(node) {
					$scope.changeHandler({node: node});
				}

				$scope.buildHtml = function() {
					var template = $scope.isGroup($scope.node)? $scope.groupTemplate : $scope.leafTemplate;
					$element.append($compile(template)($scope));
				};
			}],
			compile: function(tElem, tAttrs) {
				return {
					pre: function(scope, iElem, iAttrs) {
						scope.node = scope.$eval(iAttrs.glTreeNode);
						scope.treeDepth = scope.treeDepth+1;
						scope.isExpanded = true;
						scope.buildHtml();
					}
				};
			}
		}
	}

	function glCheckTreeNode() {
		return {
			restrict: 'A',
			scope: true,
			controller: ['$scope', '$compile', '$element', function($scope, $compile, $element) {
				$scope.buildHtml = function() {
					var template = $scope.isGroup($scope.node)? $scope.groupTemplate : $scope.leafTemplate;
					$element.append($compile(angular.element(template))($scope));
				};
			}],
			compile: function(tElem, tAttrs) {
				return {
					pre: function(scope, iElem, iAttrs) {
						scope.node = scope.$eval(iAttrs.glCheckTreeNode);
						scope.treeDepth = scope.treeDepth+1;
						scope.isExpanded = true;
						scope.node._parent = scope.$parent.node;
						if (!scope.isGroup(scope.node) && !angular.isDefined(scope.node[scope.selectAttribute])) {
							scope.node[$scope.selectAttribute] = false;
						}
						scope.buildHtml();
					},
					post: function(scope, iElem, iAttrs) {
						scope.node._checkboxElement = angular.element(iElem.children()[0]).find('input');
					}
				};
			}
		};
	}

	function glTreeGroupTemplate() {
		return {
			restrict: 'A',
			compile: function(tElem, tAttrs) {
				var template = tElem.html();
				return {
					pre: function(scope, iElem, iAttrs) {
						scope.groupTemplate = template;
						iElem.remove();
					}
				}
			}
		}
	}

	function glTreeLeafTemplate() {
		return {
			restrict: 'A',
			compile: function(tElem, tAttrs) {
				var template = tElem.html();
				return {
					pre: function(scope, iElem, iAttrs) {
						scope.leafTemplate = template;
						iElem.remove();
					}
				}
			}
		}
	}
})();
