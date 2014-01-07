glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/component/visible',
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
        Collisionable,
        Draggable,
        SAT,
        BaseObject
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Separation'
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
            var obj1 = BaseObject(Visible, Collisionable, Draggable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 0
                            },
                            image: Loader.getAsset('logoLD')
                        });
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
                obj2 = BaseObject(Visible, Collisionable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 300
                            },
                            image: Loader.getAsset('logoLD')
                        });
                    },
                    update: function (deltaT) {
                        this.collisionable.update(deltaT);
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