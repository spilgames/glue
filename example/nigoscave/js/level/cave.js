glue.module.create('js/level/cave',
	[
		'glue',
		'glue/math/vector',
		'js/level/tilemap',
		'js/level/chunks'
	],
	function (
		Glue,
		Vector,
		Tilemap,
		Chunks
	) {
		return function (seed, maxWidth, player) {
			var Sugar = Glue.sugar,
				group = [],
				module = {
					init: function () {
						var i,
							len,
							position = Vector(0, 0),
							map,
							tileMap;
						for (i = 0, len = seed.length; i < len; ++i) {
							map = Chunks[seed.charAt(i)];
							tileMap = Tilemap(map, position.x, position.y, 'ball', player);
							tileMap.init();
							if (position.x + tileMap.getWidth() >= maxWidth * tileMap.getWidth()) {
								position.x = 0;
								position.y += tileMap.getHeight();
							} else {
								position.x += tileMap.getWidth();
							}
							group[group.length] = tileMap;
						}
					},
					getMaps: function () {
						return group;
					},
					draw: function (deltaT, context, scroll) {
						var i,
							len;
						for (i = 0, len = group.length; i < len; ++i) {
							group[i].draw(deltaT, context, scroll);
						}
					}
				};

			return module;
		}
	}
);