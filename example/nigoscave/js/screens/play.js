glue.module.create(
    'js/screens/play',
    [
        'glue/loader',
        'glue/game',
        'glue/director',
        'glue/screen',
        'glue/baseobject',
        'js/objects/player',
        'js/level/generator',
        'js/level/cave'
    ],
    function (
        Loader,
        Game,
        Director,
        Screen,
        BaseObject,
        Player,
        Generator,
        Cave
    ) {
        return function () {
            var screen = Screen('Play'),
                canvasDimension = Game.canvas.getDimension(),
                cave,
                player = Player('ball', 50, 50),
                scroll = Game.getScroll(),
                clearScreen = function (context, color) {
                    var oldColor = context.fillStyle;
                    context.fillStyle = color;
                    context.fillRect(0, 0, canvasDimension.width, canvasDimension.height);
                    context.fillStyle = oldColor;
                };
            screen.init = function () {
                player.init();
                cave = Cave(Generator.makeSequence('abcdefghabcdefghabcdefghabcdefghabcdefgh'), 4, player);
                cave.init();
            };

            screen.draw = function (deltaT, context) {
                var position = player.getPosition();
                clearScreen(context, '#000');
                context.save();
                context.translate(-(position.x) + (canvasDimension.width / 2), -(position.y) +  (canvasDimension.height / 2));
                player.update();
                cave.draw(deltaT, context, scroll);
                player.draw(deltaT, context, scroll);
                
                context.restore();
            };

            screen.pointerDown = function (e) {
                Director.showScreen('Menu');
            };

            return screen;
        };
    }
);
