glue.module.get(
    [
        'glue',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/director',
        'js/screens/menu',
        'js/screens/play'
    ],
    function (
        Glue,
        Game,
        Loader,
        Dimension,
        Director,
        Menu,
        Play
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Nigo\'s Cave'
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
                    tile: 'tile.png',
                    player: 'player.png',
                    logo: 'logo.png',
                    bomb: 'bomb.png'
                }
            }
        }, function () {
            var menu = Menu(),
                play = Play();

            Director.addScreen(menu);
            Director.addScreen(play);
            Director.showScreen('Menu');
        });
    }
);