glue.module.create(
    'js/screens/play',
    [
        'glue/director',
        'glue/screen'
    ],
    function (
        Director,
        Screen
    ) {
        return function () {
            var screen = Screen('Play'),
                clearScreen = function (context, color) {
                    var oldColor = context.fillStyle;
                    context.fillStyle = color;
                    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
                    context.fillStyle = oldColor;
                };
            screen.init = function () {
                
            };

            screen.draw = function (deltaT, context) {
                clearScreen(context, '#000');

            };

            screen.pointerDown = function (e) {
                Director.showScreen('Menu');
            };

            return screen;
        };
    }
);
