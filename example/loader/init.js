glue.module.get(
    [
        'glue/game',
        'glue/math/dimension',
        'glue/loader'
    ],
    function (
        Game,
        Dimension,
        Loader) {
        'use strict';

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
                path: 'asset/',
                image: {
                    asset1: 'asset1.jpg',
                    asset2: 'asset2.jpg',
                    asset3: 'asset3.jpg',
                    asset4: 'asset4.jpg'
                }
            }
        }, function () {
            console.log('All assets are loaded, start the game.');
        });
    }
);
