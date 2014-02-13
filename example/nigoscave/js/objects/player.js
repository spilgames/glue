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
        'js/level/gamescale',
        'js/objects/bomb'
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
        GameScale,
        Bomb
    ) {
        var bounds,
            position,
            velocity,
            maxVelocity,
            side,
            scale,
            vBound,
            speed,
            currentAnimation,
            sound = new Audio('asset/jump.wav'),
            i,
            bombIndex = 0,
            tileList,
            module = BaseObject(Visible, Animatable, Kineticable, Scalable).add({
                init: function (list) {
                    this.scalable.setScale(GameScale);
                    this.animatable.setup({
                        position: {
                            x: 16 * GameScale.x,
                            y: 16 * GameScale.y
                        },
                        animation: {
                            fps: 5,
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
                    currentAnimation = 'idle';
                    speed = GameScale.x;
                    this.setOrigin(Vector(3, 0));
                    this.animatable.setAnimation(currentAnimation);
                    this.kineticable.setup({
                        velocity: Vector(0, 0),
                        gravity: Vector(0, 0.05 * speed),
                        maxVelocity: Vector(0, 40)
                    });
                    scale = this.scalable.getScale();
                    boundsR = this.kineticable.toRectangle();
                    this.position = this.kineticable.getPosition();
                    velocity = this.kineticable.getVelocity();
                    maxVelocity = this.kineticable.getMaxVelocity();
                    side = this.kineticable.getSide();
                    bounds = this.kineticable.getDimension();
                    tileList = list;

                    this.bombs = [];

                    for (i = 0; i < 3; ++i) {
                        this.bombs[this.bombs.length] = Bomb().init();
                    }
                },
                update: function (deltaT) {
                    var i,
                        len;
                    velocity.x = 0;

                    if (Keyboard.isKeyHit(Keyboard.KEY_UP) && this.kineticable.isTouching(SAT.BOTTOM)) {
                        velocity.y -= speed * 2;
                        sound.play();
                    }

                    if (Keyboard.isKeyHit(Keyboard.KEY_SPACE)) {
                        this.bombs[bombIndex].shoot(Vector(scale.x / 2,0), this.position, tileList);
                        bombIndex++;
                        if (bombIndex > this.bombs.length - 1) {
                            bombIndex = 0;
                        }
                    }

                    if (Keyboard.isKeyDown(Keyboard.KEY_RIGHT) && !Keyboard.isKeyDown(Keyboard.KEY_A) && !this.kineticable.isTouching(SAT.RIGHT)) {
                        velocity.x = speed;
                        scale.x = GameScale.x;
                    } else if (Keyboard.isKeyDown(Keyboard.KEY_LEFT) && !this.kineticable.isTouching(SAT.LEFT)) {
                        velocity.x = -speed;
                        scale.x = GameScale.x * -1;
                    }

                    if (velocity.x === 0 && velocity.y === 0 && currentAnimation !== 'idle') {
                        currentAnimation = 'idle';
                        this.animatable.setAnimation(currentAnimation);
                    } else if (velocity.x !== 0 && this.kineticable.isTouching(SAT.BOTTOM) && currentAnimation !== 'run') {
                        currentAnimation = 'run';
                        this.animatable.setAnimation(currentAnimation);
                    } else if (velocity.y !== 0 && !this.kineticable.isTouching(SAT.BOTTOM) && currentAnimation !== 'jump') {
                        currentAnimation = 'jump';
                        this.animatable.setAnimation(currentAnimation);
                    }
                    this.scalable.update(deltaT);
                    this.kineticable.update(deltaT);
                    this.animatable.update(deltaT);

                    for (i = 0, len = this.bombs.length; i < len; ++i) {
                        this.bombs[i].update(deltaT);
                    }
                },
                draw: function (deltaT, context) {
                    var i,
                        len;
                    context.imageSmoothingEnabled = false;        
                    context.mozImageSmoothingEnabled = false;
                    context.oImageSmoothingEnabled = false;
                    context.webkitImageSmoothingEnabled = false;
                    this.animatable.update(deltaT);
                    this.animatable.draw(deltaT, context);
                    for (i = 0, len = this.bombs.length; i < len; ++i) {
                        this.bombs[i].draw(deltaT, context);
                    }
                },
                reset: function () {
                    this.kineticable.setVelocity(Vector(0, 0));
                    this.kineticable.setPosition(Vector(0, 0));
                }
            });

        return module;
    }
);