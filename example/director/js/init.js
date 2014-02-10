glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/director',
        'js/screens/screen1',
        'js/screens/screen2'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Director,
        Screen1,
        Screen2
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Director'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(800, 600)
            },
            develop: {
                debug: true
            },
            asset: {
                path: '../',
                image: {
                    glue: 'glue-logo.png',
                    spil: 'spil-logo.png',
                    dog: 'dog-sit.png'
                }
            }
        }, function () {
            var screen1 = Screen1(),
                screen2 = Screen2();

            Director.addScreen(screen1);
            Director.addScreen(screen2);
            Director.showScreen('Screen1');
        });
    }
);