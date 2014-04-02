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
            var screen = Screen('Screen1').add({
                onShow: function () {
                    // adding onShow and onHide functions is optional
                    console.log('Screen 1 shown');
                },
                onHide: function () {
                    console.log('Screen 1 hidden');
                }
            });
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
