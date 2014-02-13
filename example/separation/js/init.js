glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/math/vector',
        'glue/component/spritable',
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
        Spritable,
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
                    logoLD: 'glue-logo-ld.png'
                }
            }
        }, function () {
            var obj1 = BaseObject(Spritable, Kineticable, Draggable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 0,
                                y: 0
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.kineticable.setup({
                            dynamic: false
                        });
                    }
                }),
                obj2 = BaseObject(Spritable, Kineticable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 400,
                                y: 300
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.kineticable.setup();
                    },
                    update: function (deltaT) {
                        this.base.update(deltaT);
                        SAT.collide(obj1, obj2)
                    }
                });
            Game.add(obj1);
            Game.add(obj2);
            var v = Vector(0, 0);
            v.static.add(v, v);
        });
    }
);