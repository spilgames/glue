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
        'glue/fastsat',
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
                createObject = function () {
                    var position,
                        object = BaseObject(Visible, Kineticable).add({
                        init: function () {
                            this.visible.setup({
                                position: {
                                    x: 400,
                                    y: Mathematics().random(0, Game.canvas.getDimension().height - 100)
                                },
                                image: Loader.getAsset('blueBall')
                            });
                            position = this.visible.getPosition();
                            this.kineticable.setup({
                                dynamic: false,
                                velocity: Vector(1, 0)
                            });
                        },
                        update: function (deltaT) {
                            this.kineticable.update(deltaT);
                            if (position.x > 800) {
                                position.x = 0;
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
                        SAT.resetSpatial();
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
                        SAT.checkOverlap(this);
                    }
                });
            
            SAT.setup();
            createObject();
            createObject();
            createObject();
            Game.add(redBall);
        });
    }
);