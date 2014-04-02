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
            var screen = Screen('Screen2').add({
                onShow: function () {
                    // adding onShow and onHide functions is optional
                    console.log('Screen 2 shown');
                },
                onHide: function () {
                    console.log('Screen 2 hidden');
                }
            });
            screen.addObject(SpilObject());
            screen.addObject(DogObject());
            screen.draw = function (gameData) {
                var context = gameData.context;
                context.fillStyle = 'blue';
                context.font = 'bold 16px Arial';
                context.fillText('Drop the dog on the SpilGames logo to go back to screen 1', 210, 580);
            };
            return screen;
        };
    }
);
