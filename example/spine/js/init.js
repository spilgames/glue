glue.module.get(
    [
        'glue/domready',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible',
        'glue/component/draggable',
        'glue/component/scalable',
        'vendors/spine/spineable'
    ],
    function (
        Domready,
        Game,
        Loader,
        Dimension,
        Vector,
        Component,
        Visible,
        Draggable,
        Scalable,
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
                    image: {
                        path: 'asset/',
                        source: {
                            capivara: 'capivara.png',
                            capivara_sideview: 'capivara-sideview.png'
                        }
                    }
                }
            }, function () {
                var scroll = Game.getScroll(),
                    spine = Component(Visible, Spineable, Scalable, Draggable).add({
                        init: function () {
                            this.spineable.setup({
                                position: {
                                    x: 100,
                                    y: 200
                                },
                                atlasImage: 'capivara_sideview',
                                atlas: 'capivara_sideview_atlas',
                                skeleton: 'capivara_sideview_skeleton',
                                // optional setting: you can rescale the bones
                                // useful for using differently sized assets
                                skeletonResolution: 1
                            });
                            this.spineable.setAnimation('walk');
                        },
                        update: function (deltaT, context) {
                            this.spineable.update(deltaT);
                        },
                        draw: function (deltaT, context, scroll) {
                            this.spineable.draw(deltaT, context, scroll);
                        }
                    });
                Game.add(spine);
            });
        });
    }
);