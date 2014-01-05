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
            return screen;
        };
    }
);
