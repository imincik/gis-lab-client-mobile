angular.module('gl.tools', ['gl.map', 'ivh.treeview', 'ui.grid', 'ui.grid.edit'])
	.config(function(ivhTreeviewOptionsProvider) {
		ivhTreeviewOptionsProvider.set({
			idAttribute: 'id',
			labelAttribute: 'title',
			childrenAttribute: 'layers',
			selectedAttribute: 'visible',
			indeterminateAttribute: '__indeterminate',
			twistieExpandedTpl: '<i class="fa fa-minus-square"></i>',
			twistieCollapsedTpl: '<i class="fa fa-plus-square"></i>',
		});
	});
