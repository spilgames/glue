glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/math/vector',
        'glue/component/visible',
        'glue/component/gravitatable',
        'glue/component/collidable',
        'glue/component/draggable',
        'glue/sat',
        'glue/baseobject'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Rectangle,
        Vector,
        Visible,
        Gravitatable,
        Collidable,
        Draggable,
        SAT,
        BaseObject
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Gravity'
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
                        logoLD: 'glue-logo-ld.png'
                    }
                }
            }
        }, function () {
            var obj1 = BaseObject(Visible, Collidable, Draggable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 400
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.collidable.setStatic(true);
                    },
                    update: function (deltaT) {
                        this.collidable.update(deltaT);
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
                obj2 = BaseObject(Visible, Collidable, Gravitatable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 0
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.gravitatable.setGravity(Vector(
                            0,
                            0.5
                        ));

                        this.gravitatable.setMaxVelocity(Vector(
                            0,
                            20
                        ));
                        this.gravitatable.setBounce(Vector(
                            0,
                            0.4
                        ));
                    },
                    update: function (deltaT) {
                        var position = this.visible.getPosition();
                        if (position.y > Game.canvas.getDimension().height) {
                            position.y = -this.visible.getDimension().height;
                            this.visible.setPosition(position);
                        }
                        this.gravitatable.update(deltaT);
                        this.collidable.update(deltaT);
                        SAT.collide(obj1, obj2);
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                });
            Game.add(obj1);
            Game.add(obj2);
        });
    }
);