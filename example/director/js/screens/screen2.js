glue.module.create(
    'js/screens/screen2',
    [
        'glue/screen',
        'js/objects/dog'
    ],
    function (
        Screen,
        DogObject
    ) {
        return function () {
            var screen = Screen('Screen2');
            screen.addObject(DogObject());
            return screen;
        };
    }
);
