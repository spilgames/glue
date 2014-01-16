glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/component/visible',
        'glue/component/kineticable',
        'glue/component/draggable',
        'glue/component/clickable',
        'glue/component/scalable',
        'glue/sat',
        'glue/baseobject',
        'glue/math',
        'glue/math/vector'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Rectangle,
        Visible,
        Kineticable,
        Draggable,
        Clickable,
        Scalable,
        SAT,
        BaseObject,
        Mathematics,
        Vector
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Fast SAT'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(800, 600)
            },
            develop: {
                debug: true
            },
            asset: {
                image: {
                    path: 'asset/',
                    source: {
                        blueBall: 'ball.png',
                        redBall: 'ball2.png'
                    }
                }
            }
        }, function () {
            var math = Mathematics(),
                createObject = function (x, y) {
                    var position,
                        object = BaseObject(Visible, Kineticable).add({
                        init: function () {
                            this.visible.setup({
                                position: {
                                    x: x,
                                    y: y
                                },
                                image: Loader.getAsset('blueBall')
                            });
                            position = this.visible.getPosition();
                            this.kineticable.setup({
                                dynamic: true,
                                gravity: Vector(0, 0.5),
                                bounce: 0.6,
                                velocity: Vector(math.random(-10, 10), 0),
                                maxVelocity: Vector(0, 20)
                            });
                        },
                        update: function (deltaT) {
                            SAT.collide(this);
                            this.kineticable.update(deltaT);
                            if (position.x > 800) {
                                position.x = -50;
                            }
                            if (position.y > 600) {
                                position.y = -50;
                            }
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    });
                    Game.add(object);
                    SAT.addObject(object);
                },
                redBall = BaseObject(Visible, Kineticable, Draggable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 400
                            },
                            image: Loader.getAsset('redBall')
                        });
                        this.kineticable.setup({
                            dynamic: false
                        });
                    },
                    update: function (deltaT) {
                        SAT.collide(this);
                        this.kineticable.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    },
                    pointerDown: function (e) {
                        this.draggable.pointerDown(e);
                    },
                    pointerMove: function (e) {
                        this.draggable.pointerMove(e);
                    },
                    pointerUp: function (e) {
                        this.draggable.pointerUp(e);
                    }
                });
            
            SAT.setup();
            for (var i = 0; i < 50; ++i) {
                createObject(math.random(0, Game.canvas.getDimension().width - 25), -50);
            }
            Game.add(redBall);
        });
    }
);