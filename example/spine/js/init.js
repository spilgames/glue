glue.module.get(
    [
        'glue/domready',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/visible',
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
        Visible,
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
                    image: {
                        capivara: 'capivara.png',
                        capivara_sideview: 'capivara-sideview.png'
                    },
                    json: {
                        capivara_skeleton: 'asset/capivara-skeleton.json',
                        capivara_sideview_skeleton: 'asset/capivara-skeleton-sideview.json'
                    },
                    binary: {
                        capivara_atlas: 'asset/capivara.atlas',
                        capivara_sideview_atlas: 'asset/capivara-sideview.atlas'
                    }
                }
            }, function () {
                var scroll = Game.getScroll(),
                    capivara = BaseObject(Spineable, Scalable, Rotatable, Draggable).add({
                        init: function () {
                            this.spineable.setup({
                                position: Vector(300, 300),
                                atlasImage: Loader.getAsset('capivara_sideview'),
                                atlas: Loader.getAsset('capivara_sideview_atlas'),
                                skeleton: Loader.getAsset('capivara_sideview_skeleton'),
                                // optional setting: you can rescale the bones
                                // useful for using differently sized assets
                                skeletonResolution: 1
                            });
                            this.spineable.setAnimation('walk');
                        }
                    });

                Game.add(capivara);
                // set origin
                capivara.setOrigin(Vector(150, 150));
                // set an angle
                // capivara.rotatable.setAngleDegree(45);
                // scale
                // capivara.scalable.setScale(Vector(2, 2));
                // flip
                // capivara.scalable.setScale(Vector(-1, 1));
            });
        });
    }
);