glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/component/visible',
        'glue/component/gravitatable',
        'glue/component/collisionable',
        'glue/component/draggable',
        'glue/sat',
        'glue/baseobject'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Rectangle,
        Visible,
        Gravitatable,
        Collisionable,
        Draggable,
        SAT,
        BaseObject
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Group Collision'
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
                        logoLD: 'glue-logo-ld.png',
                        ball: 'ball.png'
                    }
                }
            }
        }, function () {
            var rand = function (min, max) {
                    return ~~(Math.random() * (max - min + 1)) + min;
                },
                obj1 = BaseObject(Visible, Collisionable, Draggable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 400
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.collisionable.setStatic(true);
                    },
                    update: function (deltaT) {
                        this.collisionable.update(deltaT);
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
                }),
                group = [];
            Game.add(obj1);
            for (var i = 0; i < 100; ++i) {
                var obj = BaseObject(Visible, Collisionable, Gravitatable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: Math.random() * Game.canvas.getDimension().width - 70,
                                y: Math.random() * -100
                            },
                            image: Loader.getAsset('ball')
                        });
                        this.gravitatable.setGravity({
                            y: 0.5
                        });

                        this.gravitatable.setVelocity({
                            x: rand(-10, 10)
                        });

                        this.gravitatable.setMaxVelocity({
                            y: 20
                        });
                        this.gravitatable.setBounce({
                            x: 1,
                            y: .6
                        });
                    },
                    update: function (deltaT) {
                        var position = this.visible.getPosition(),
                            size = this.visible.getDimension(),
                            canvasSize = Game.canvas.getDimension();
                        if (position.y > canvasSize.height) {
                            position.y = -size.height;
                        }
                        if (position.x > canvasSize.width) {
                            position.x = -size.width;
                        } else if (position.x + size.width < 0){
                            position.x = canvasSize.width;
                        }
                        this.visible.setPosition(position);

                        this.gravitatable.update(deltaT);
                        this.collisionable.update(deltaT);
                        SAT.collide(obj1, this);
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                });
                group.push(obj);
                Game.add(obj);
            }
        });
    }
);