glue.module.create(
    'js/screens/screen1',
    [
        'glue/screen',
        'js/objects/dog',
        'js/objects/glue',
        'js/objects/spil'
    ],
    function (
        Screen,
        Dog,
        Glue,
        Spil
    ) {
        return function () {
            var screen = Screen('Screen1');
            screen.addObject(Dog());
            screen.addObject(Glue());
            screen.addObject(Spil());
            return screen;
        };
    }
);
