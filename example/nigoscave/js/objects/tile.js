glue.module.create(
	'js/objects/tile',
	[
		'glue/loader',
		'glue/baseobject',
		'glue/component/visible',
		'glue/component/kineticable',
		'glue/component/scalable',
		'glue/math/vector'
	],
	function (
		Loader,
		BaseObject,
		Visible,
		Kineticable,
		Scalable,
		Vector
	) {
		return function (x, y) {
			var position,
				bounds,
				object = BaseObject(Visible, Kineticable, Scalable).add({
					init: function () {
						this.visible.setup({
							position: {
								x: x,
								y: y
							},
							image: Loader.getAsset('tile')
						});
						this.kineticable.setup({
							dynamic: false
						});
						this.scalable.setScale(Vector(10, 10));
						position = this.kineticable.getPosition();
						bounds = this.kineticable.getDimension();
						bounds.width = bounds.height = 160;
					},
					update: function (deltaT) {
						this.kineticable.update(deltaT);
					},
					draw: function (deltaT, context) {
						this.visible.draw(deltaT, context);
					}
				});
			return object;
		};
	}
);