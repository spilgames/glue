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
        'js/input/keyboard',
        'js/level/gamescale'
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
        Keyboard,
        GameScale
    ) {
        var bounds,
            position,
            velocity,
            maxVelocity,
            side,
            scale,
            vBound,
            module = BaseObject(Visible, Animatable, Kineticable, Scalable).add({
                init: function () {
                    this.scalable.setScale(GameScale);
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
                    this.visible.setOrigin(Vector(3, 0));
                    this.animatable.setAnimation('run');
                    this.kineticable.setup({
                        velocity: Vector(0, 0),
                        gravity: Vector(0, 0.5),
                        maxVelocity: Vector(0, 40)
                    });
                    scale = this.scalable.getScale();
                    boundsR = this.kineticable.toRectangle();
                    this.position = this.kineticable.getPosition();
                    velocity = this.kineticable.getVelocity();
                    maxVelocity = this.kineticable.getMaxVelocity();
                    side = this.kineticable.getSide();
                    bounds = this.kineticable.getDimension();
                },
                update: function (deltaT) {
                    
                    velocity.x = 0;

                    if (Keyboard.isKeyHit(Keyboard.KEY_W) && this.kineticable.isTouching(SAT.BOTTOM)) {
                        velocity.y -= 20;
                    }
                    if (Keyboard.isKeyDown(Keyboard.KEY_D) && !Keyboard.isKeyDown(Keyboard.KEY_A) && !this.kineticable.isTouching(SAT.RIGHT)) {
                        velocity.x = 10;
                        scale.x = GameScale.x;
                    } else if (Keyboard.isKeyDown(Keyboard.KEY_A) && !this.kineticable.isTouching(SAT.LEFT)) {
                        velocity.x = -10;
                        scale.x = GameScale.x * -1;
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