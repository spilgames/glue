glue.module.create(
    'js/screens/menu',
    [
        'glue/game',
        'glue/screen',
        'glue/director'
    ],
    function (
        Game,
        Screen,
        Director
    ) {
        return function () {
            var screen = Screen('Menu'),
                canvasDimension = Game.canvas.getDimension();
            screen.update = function (deltaT) {

            };
            screen.draw = function (deltaT, context) {
                context.textAlign = 'center';
                context.font = '40px Verdana';
                context.fillText('Click to Play!', canvasDimension.width / 2, canvasDimension.height / 2);
            };

            screen.pointerDown = function (e) {
                Director.showScreen('Play');
            };
            return screen;
        };
    }
);
