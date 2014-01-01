glue.module.get(
    [
        'glue/domready',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible'
    ],
    function (
        Domready,
        Game,
        Loader,
        Dimension,
        Vector,
        Component,
        Visible
    ) {
        'use strict';
        Domready(function () { 
            Game.setup({
                game: {
                    name: 'Scrolling'
                },
                canvas: {
                    id: 'canvas',
                    dimension: Dimension(600, 600)
                },
                develop: {
                    debug: true
                },
                asset: {
                    image: {
                        path: 'asset/',
                        source: {
                            blocks: 'block-sheet.png'
                        }
                    }
                }
            }, function () {
                var scrollSpeed = 50,
                    scroll = Game.getScroll(),
                    component = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: Vector(320, 300),
                            image: Loader.getAsset('blocks')
                        });
                    },
                    update: function (deltaT, scroll) {
                        if (scroll.x < this.visible.getDimension().width) {
                            scroll.x += deltaT * scrollSpeed;
                        }
                    },
                    draw: function (deltaT, context, scroll) {
                        this.visible.draw(deltaT, context, scroll);
                    }
                });

                Game.add(component);
            });
        });
    }
);