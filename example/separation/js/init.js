glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/math/vector',
        'glue/component/visible',
        'glue/component/kineticable',
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
        Kineticable,
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
                path: 'asset/',
                image: {
                    source: {
                        logoLD: 'glue-logo-ld.png'
                    }
                }
            }
        }, function () {
            var obj1 = BaseObject(Visible, Kineticable, Draggable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 0
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.kineticable.setup({
                            dynamic: false
                        });
                    },
                    update: function (deltaT) {
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
                }),
                obj2 = BaseObject(Visible, Kineticable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 300
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.kineticable.setup();
                    },
                    update: function (deltaT) {
                        this.kineticable.update(deltaT);
                        SAT.collide(obj1, obj2)
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                });
            Game.add(obj1);
            Game.add(obj2);
            var v = Vector(0, 0);
            v.static.add(v, v);
        });
    }
);