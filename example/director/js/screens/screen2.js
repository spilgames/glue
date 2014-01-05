glue.module.create(
    'js/screens/screen2',
    [
        'glue/screen',
        'js/objects/spil',
        'js/objects/dog'
    ],
    function (
        Screen,
        SpilObject,
        DogObject
    ) {
        return function () {
            var screen = Screen('Screen2');
            screen.addObject(SpilObject());
            screen.addObject(DogObject());
            screen.draw = function (deltaT, context) {
                context.fillStyle = 'blue';
                context.font = 'bold 16px Arial';
                context.fillText('Drop the dog on the SpilGames logo to go back to screen 1', 210, 580);
            };
            return screen;
        };
    }
);
