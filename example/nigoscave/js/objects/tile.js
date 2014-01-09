glue.module.create('js/objects/tile',
	[
		'glue/loader',
		'glue/baseobject',
		'glue/component/visible',
		'glue/component/collidable',
		'glue/sat'
	],
	function (
		Loader,
		BaseObject,
		Visible,
		Collidable,
		SAT
	) {
		return function (assetName, player) {
			var object = BaseObject(Visible, Collidable).add({
					init: function () {
						this.visible.setup({
							image: Loader.getAsset(assetName)
						});
						this.collidable.setStatic(true);
					},
					update: function (deltaT) {
						this.collidable.update(deltaT);
						SAT.collide(this, player, SAT.CIRCLE_TO_CRICLE);
					},
					draw: function (deltaT, context, scroll) {
						var bounds = this.collidable.getBoundingBox();
						//this.visible.draw(deltaT, context, scroll);
						context.strokeStyle = '#ff0000';
						context.strokeRect(bounds.x1, bounds.y1, bounds.x2, bounds.y2);
					},
					setPosition: function (vector) {
						this.visible.setPosition(vector);
					}
 				});
			return object;
		}
	}
);