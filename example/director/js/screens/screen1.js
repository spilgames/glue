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
            screen.add(Dog);
            screen.add(Glue);
            screen.add(Spil);
            return screen;
        };
    }
);
