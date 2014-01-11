glue.module.create(
	'js/objects/tilemap',
	[
		'glue/math/vector',
		'js/objects/tile'
	],
	function (
		Vector,
		Tile
	) {
		return function (array, x, y, maxWidth) {
			var list = [],
				object = {
					x: x || 0,
					y: y || 0,
					draw: function (deltaT, context) {
						var i,
							len;
						for (i = 0, len = list.length; i < len; ++i) {
							list[i].draw(deltaT, context);
						}
					},
					getList: function () {
						return list;
					}
				},
				ix,
				iy,
				lenx,
				leny,
				tile,
				pos,
				size,
				j,
				lenj,
				off = Vector(0, 0);
			for (j = 0, lenj = array.length; j < lenj; ++j) {
				for (iy = 0, leny = array[j].length; iy < leny; ++iy) {
					for (ix = 0, lenx = array[j][iy].length; ix < lenx; ++ix) {
						if (array[j][iy][ix] > 0) {
							tile = Tile(x, y);
							tile.init();
							size = tile.kineticable.getDimension();
							pos = tile.kineticable.getPosition();
							pos.x += off.x + (size.width * ix);
							pos.y += off.y + (size.height * iy);
							list[list.length] = tile;
						}   
					}
				}
				off.x += size.width * array[0][0].length;
				if (off.x >= maxWidth * array[0][0].length * size.width) {
					off.x = 0;
					off.y += size.height * array[0].length;
				}
			}
			

			return object;
		};
	}
);