glue.module.create('js/level/tilemap',
	[
		'glue',
		'glue/sat',
		'glue/math/vector',
		'js/objects/tile',
		'glue/loader'
	],
	function (
		Glue, 
		SAT,
		Vector,
		Tile,
		Loader
	) {
		return function (mapArray, x, y, tileSet, player) {
			var Sugar = Glue.sugar,
				array = mapArray,
				defaultSize = 10,
				group = [],
				module = {
					x: x || 0,
					y: y || 0,
					getWidth: function () {
						if (array.length > 0) {
							return array[0].length * Loader.getAsset(tileSet).width;
						} else {
							return 0;
						}
					},
					getHeight: function () {
						return array.length * Loader.getAsset(tileSet).height;
					},
					getTileWidth: function () {
						var dimension;
						if (Sugar.isDefined(tileSet) && Sugar.isDefined(tileSet.visible)) {
							return dimension.width;
						} else {
							return defaultSize;
						}
					},
					getTileHeight: function () {
						var dimension;
						if (Sugar.isDefined(tileSet) && Sugar.isDefined(tileSet.visible)) {
							return dimension.height;
						} else {
							return defaultSize;
						}
					},
					getTileSet: function () {
						return Loader.getAsset(tileSet);
					},
					init: function () {
						var ix,
							iy,
							position,
							dimension,
							lenx,
							tile,
							leny;
						for (iy = 0, leny = array.length; iy < leny; ++iy) {
							for (ix = 0, lenx = array[iy].length; ix < lenx; ++ix) {
								if (array[iy][ix] > 0) {
									tile = Tile(tileSet, player);
									tile.init();
									dimension = tile.visible.getDimension();
									position = Vector(
										module.x + (dimension.width * ix),
										module.y + (dimension.height * iy)
									);
									tile.setPosition(position);
									group[group.length] = tile;
								}
							}
						}
					},
					draw: function (deltaT, context, scroll) {
						var i,
							len;
						for (i = 0, len = group.length; i < len; ++i) {
							group[i].update(deltaT);
							group[i].draw(deltaT, context, scroll);
						}
					}
				};
				
			return module;
		};
	}
);