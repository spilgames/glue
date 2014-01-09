glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/director',
        'js/screens/menu',
        'js/screens/play'
    ],
    function (
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
                image: {
                    path: 'asset/',
                    source: {
                        ball: 'ball.png'
                    }
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