glue.module.create(
    'js/screens/screen1',
    [
        'glue/screen',
        'js/objects/glue',
        'js/objects/dog'
    ],
    function (
        Screen,
        GlueObject,
        DogObject
    ) {
        return function () {
            var screen = Screen('Screen1');
            screen.addObject(GlueObject());
            screen.addObject(DogObject());
            screen.draw = function (gameData) {
                var context = gameData.context;
                context.fillStyle = 'blue';
                context.font = 'bold 16px Arial';
                context.fillText('Drop the dog on the Glue logo to go to screen 2', 210, 580);
            };
            return screen;
        };
    }
);
