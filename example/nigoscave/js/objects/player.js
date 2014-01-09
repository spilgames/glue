glue.module.create('js/objects/player',
	[
		'glue/loader',
		'glue/baseobject',
		'glue/component/visible',
		'glue/component/gravitatable',
		'glue/component/collidable',
		'glue/math/vector',
		'js/input/keyboard'
	],
	function (
		Loader,
		BaseObject,
		Visible,
		Gravitatable,
		Collidable,
		Vector,
		Keyboard
	) {
		return function (assetName, x, y) {
			var object = BaseObject(Visible, Gravitatable, Collidable).add({
					init: function () {
						this.visible.setup({
							position: {
								x: x,
								y: y
							},
							image: Loader.getAsset(assetName)
						});
						this.gravitatable.setVelocity(Vector(
							0,
							0
						));
						this.gravitatable.setGravity(Vector(
							0,
							0.5
						));
						this.gravitatable.setMaxVelocity(Vector(
							0,
							20
						));
						this.collidable.setBoundingDimension({
							width: 25,
							height: 25
						});
						this.visible.setOrigin(Vector(
							25,
							25
						));
					},
					update: function (deltaT) {
						var velocity = this.gravitatable.getVelocity();
						velocity.x = 0;

						if (Keyboard.isKeyDown(Keyboard.KEY_D)) {
							velocity.x = 5;
						} else if (Keyboard.isKeyDown(Keyboard.KEY_A)) {
							velocity.x = -5;
						}

						if (Keyboard.isKeyHit(Keyboard.KEY_W) && this.collidable.hitBottom()) {
							velocity.y -= .8 * this.gravitatable.getMaxVelocity().y;
						}

						this.gravitatable.update(deltaT);
						this.gravitatable.setVelocity(velocity);
						this.collidable.update(deltaT);
					},
					draw: function (deltaT, context, scroll) {
						var bounds = this.collidable.getBoundingBox();
						//this.visible.draw(deltaT, context, scroll);
						context.strokeStyle = '#ff0000';
						context.strokeRect(bounds.x1, bounds.y1, bounds.x2, bounds.y2);
					},
					getPosition: function () {
						return this.visible.getPosition();
					}
				});

			return object;
		}
	}
);