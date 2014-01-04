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
                image: {
                    path: '../image/',
                    source: {
                        glue: 'glue-logo.png',
                        spil: 'spil-logo.png',
                        dog: 'dog-sit.png'
                    }
                }
            }
        }, function () {
            var screen1 = Screen1(),
                screen2 = Screen2(),
                director = Director;

            director.addScreen(screen1);
            director.addScreen(screen2);
            director.displayScreen('Screen1');
        });
    }
);