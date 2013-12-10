glue.module.get(
    [
        'glue/domready',
        'glue/game',
        'glue/math/dimension',
        'glue/loader'
    ],
    function (
        DomReady,
        Game,
        Dimension,
        Loader) {
        'use strict';

        DomReady(function () {
            Game.setup({
                game: {
                    name: 'Loader example'
                },
                canvas: {
                    id: 'canvas',
                    dimension: Dimension(1024, 768)
                },
                develop: {
                    debug: true
                },
                asset: {
                    image: {
                        path: 'asset/',
                        source: {
                            asset1: 'asset1.jpg',
                            asset2: 'asset2.jpg'
                        }
                    }
                }
            }, function () {
                console.log('All assets are loaded, start the game.');
            });
        });
    }
);
