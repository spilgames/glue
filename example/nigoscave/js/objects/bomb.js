glue.module.create(
	'js/objects/bomb',
	[
		'glue',
		'glue/math/vector',
		'glue/baseobject',
		'glue/component/visible',
		'glue/component/kineticable',
		'glue/component/scalable',
		'glue/loader',
		'glue/sat',
		// ----
		'js/level/gamescale'
	],
	function (
		Glue,
		Vector,
		BaseObject,
		Visible,
		Kineticable,
		Scalable,
		Loader,
		SAT,
		GameScale
	) {
		return function () {
			var timer = 0,
				life = 1000,
				velocity,
				explode = false,
				currentList,
				sound = new Audio('asset/explosion.wav'),
				millisecs = function () {
					return new Date().getTime();
				},
				object = BaseObject(Visible, Kineticable, Scalable).add({
					init: function () {
						this.scalable.setScale(GameScale);
						this.visible.setup({
							image: Loader.getAsset('bomb')
						});
						this.kineticable.setup({
							gravity: Vector(0, 0.05 * GameScale.x),
							bounce: .6,
							maxVelocity: Vector(0, 10)
						});
						this.position = this.visible.getPosition();
						velocity = this.kineticable.getVelocity();
						this.active = false;
						return this;
					},
					update: function (deltaT) {
						var i,
							len;
						if (this.active) {
							this.kineticable.update(deltaT);
							if (millisecs() - timer > life) {
								this.active = false;
								explode = true;
								timer = millisecs();
								sound.play();
								for (i = 0, len = currentList.length; i < len; ++i) {
									if (currentList[i]) {
										var pos1 = currentList[i].visible.getPosition().clone(),
											distance;
										pos1.x += 4 * GameScale.x;
										pos1.y += 4 * GameScale.y;

										distance = this.position.distance(pos1);
										if (distance < 16 * GameScale.x) {
											currentList.splice(i,1);
										}
									}
								}
							}
						}
					},
					draw: function (deltaT, context) {
						if (this.active) {
							this.visible.draw(deltaT, context);
						}
						if (explode && !this.active) {
							context.beginPath();
							context.fillStyle = '#fff';
							context.arc(this.position.x, this.position.y, 15 * GameScale.x, 0, Math.PI * 2);
							context.fill();
							context.closePath();
							if (millisecs() - timer > 50) {
								explode = false;
							}
						}
					},
					shoot: function (velocity, position, list) {
						if (!this.active) {
							this.position.copy(position);
							this.kineticable.setVelocity(velocity);
							this.active = true;
							timer = millisecs();
							currentList = list;
						}
					}
				});

			return object;
		}	
	}
);