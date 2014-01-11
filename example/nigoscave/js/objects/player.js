glue.module.create(
    'js/objects/player',
    [
        'glue/math/vector',
        'glue/loader',
        'glue/baseobject',
        'glue/component/visible',
        'glue/component/animatable',
        'glue/component/kineticable',
        'glue/sat',
        'glue/component/scalable',
        'js/input/keyboard'
    ],
    function (
        Vector,
        Loader,
        BaseObject,
        Visible,
        Animatable,
        Kineticable,
        SAT,
        Scalable,
        Keyboard
    ) {
        var bounds,
            position,
            velocity,
            maxVelocity,
            side,
            scale,
            module = BaseObject(Visible, Animatable, Kineticable, Scalable).add({
                init: function () {
                    this.animatable.setup({
                        position: {
                            x: 50,
                            y: 50
                        },
                        animation: {
                            fps: 30,
                            frameCount: 2,
                            animations: {
                                idle: {
                                    startFrame: 1,
                                    endFrame: 1
                                },
                                jump: {
                                    startFrame: 2,
                                    endFrame: 2
                                },
                                run: {
                                    startFrame: 1,
                                    endFrame: 2
                                }
                            }
                        },
                        image: Loader.getAsset('player')
                    });
                    this.kineticable.setup({
                        velocity: Vector(0, 0),
                        gravity: Vector(0, 0.5),
                        maxVelocity: Vector(0, 40)
                    });
                    this.visible.setOrigin(Vector(3, 0));
                    this.animatable.setAnimation('run');
                    this.scalable.setScale(Vector(10, 10));
                    scale = this.scalable.getScale();
                    bounds = this.kineticable.toRectangle();
                    position = this.kineticable.getPosition();
                    bounds = this.kineticable.getDimension();
                    velocity = this.kineticable.getVelocity();
                    maxVelocity = this.kineticable.getMaxVelocity();
                    side = this.kineticable.getSide();
                    bounds.width = 60;
                    bounds.height = 80;

                },
                update: function (deltaT) {
                    
                    velocity.x = 0;

                    if (Keyboard.isKeyHit(Keyboard.KEY_W) && this.kineticable.isTouching(SAT.BOTTOM)) {
                        velocity.y -= 20;
                    }

                    if (Keyboard.isKeyDown(Keyboard.KEY_D) && !this.kineticable.isTouching(SAT.RIGHT)) {
                        velocity.x = 10;
                        scale.x = 10;
                    } else if (Keyboard.isKeyDown(Keyboard.KEY_A) && !this.kineticable.isTouching(SAT.LEFT)) {
                        velocity.x = -10;
                        scale.x = -10;
                    }

                    if (velocity.x === 0 && velocity.y === 0) {
                        this.animatable.setAnimation('idle');
                    } else if (velocity.x !== 0 && this.kineticable.isTouching(SAT.BOTTOM)) {
                        this.animatable.setAnimation('run');
                    } else if (velocity.y !== 0) {
                        this.animatable.setAnimation('jump');
                    }

                    this.kineticable.update(deltaT);
                    this.animatable.update(deltaT);
                },
                draw: function (deltaT, context) {
                    context.imageSmoothingEnabled = false;        
                    context.mozImageSmoothingEnabled = false;
                    context.oImageSmoothingEnabled = false;
                    context.webkitImageSmoothingEnabled = false;
                    var rect = this.kineticable.toRectangle();
                    this.animatable.draw(deltaT, context);
                },
                reset: function () {
                    this.kineticable.setVelocity(Vector(0, 0));
                    this.kineticable.setPosition(Vector(0, 0));
                }
            });

        return module;
    }
);