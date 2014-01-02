glue.module.get(
    [
        'glue/domready',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible',
        'vendors/spine/spinable'
    ],
    function (
        Domready,
        Game,
        Loader,
        Dimension,
        Vector,
        Component,
        Visible,
        Spinable
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
                    spine = Component(Spinable).add({
                        init: function () {
                            this.spinable.setup({
                                position: {
                                    x: 100,
                                    y: 200
                                },
                                atlasImage: 'capivara_sideview',
                                atlas: 'capivara_sideview_atlas',
                                skeleton: 'capivara_sideview_skeleton'
                            });

                            this.spinable.setAnimation('walk');
                        },
                        update: function (deltaT, context) {
                            this.spinable.update(deltaT);
                        },
                        draw: function (deltaT, context, scroll) {
                            this.spinable.draw(deltaT, context, scroll);
                        }
                    });
                Game.add(spine);
            });
        });
    }
);