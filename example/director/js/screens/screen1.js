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
            return screen;
        };
    }
);
