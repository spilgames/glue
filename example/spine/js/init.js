glue.module.get(
    [
        'glue/domready',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/draggable',
        'glue/component/scalable',
        'glue/component/rotatable',
        'glue/component/plugin/spineable'
    ],
    function (
        Domready,
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Spritable,
        Draggable,
        Scalable,
        Rotatable,
        Spineable
    ) {
        'use strict';
        Domready(function () {
            Game.setup({
                game: {
                    name: 'Spine'
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
                    spine: {
                        capivara: 'capivara',
                        capivara_sideview: 'capivara_sideview'
                    }
                }
            }, function () {
                var scroll = Game.getScroll(),
                    capivara = BaseObject(Spineable, Scalable, Rotatable, Draggable).add({
                        init: function () {
                            this.spineable.setup({
                                position: Vector(200, 150),
                                // animation property is a string or array of strings
                                animation: ['capivara', 'capivara_sideview'],
                                // optional setting: you can rescale the bones
                                // useful for using differently sized assets
                                skeletonResolution: 1
                            });
                            this.spineable.setAnimation('walk');
                        },
                        update: function (deltaT) {
                            this.spineable.update(deltaT);
                        }
                    });

                Game.add(capivara);
                // set origin
                //capivara.setOrigin(Vector(150, 150));
                // set an angle
                //capivara.rotatable.setAngleDegree(45);
                // scale
                // capivara.scalable.setScale(Vector(2, 2));
                // flip
                // capivara.scalable.setScale(Vector(-1, 1));
            });
        });
    }
);