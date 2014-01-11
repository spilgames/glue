glue.module.create(
    'js/screens/play',
    [
        'glue/director',
        'glue/screen',
        'glue/game',
        'glue/sat',

        // Game related
        'js/objects/player',
        'js/objects/tilemap',
        'js/level/generator'
    ],
    function (
        Director,
        Screen,
        Game,
        SAT,
        Player,
        Tilemap,
        Generator
    ) {
        return function () {
            var screen = Screen('Play'),
                clearScreen = function (context, color) {
                    var oldColor = context.fillStyle;
                    context.fillStyle = color;
                    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
                    context.fillStyle = oldColor;
                },
                seed = 'aecefgeaahdhbbdhcgbgcdhcecfgbd',
                tilemap = Tilemap(Generator.makeMap(Generator.makeSequence(seed)), 0, 0, 5),
                list = tilemap.getList(),
                position,
                dimension,
                typeCollision = SAT.RECTANGLE_TO_RECTANGLE,
                canvasSize = Game.canvas.getDimension();
            
            screen.init = function (deltaT, context) {
                Player.init();
                position = Player.kineticable.getPosition();
                dimension = Player.kineticable.getDimension();
            };

            screen.update = function (deltaT) {
                Player.update();
                SAT.collideGroup(Player, list, typeCollision);
            };

            screen.draw = function (deltaT, context) {
                clearScreen(context, '#000');
                context.save();
                context.translate(-(position.x + dimension.width / 2) + canvasSize.width / 2,
                                  -(position.y + dimension.height / 2) + canvasSize.height / 2);
                Player.draw(deltaT, context);
                tilemap.draw(deltaT, context);
                context.restore();
            };

            screen.pointerDown = function (e) {
                //typeCollision = typeCollision == SAT.RECTANGLE_TO_RECTANGLE ? SAT.CIRCLE_TO_CIRCLE : SAT.RECTANGLE_TO_RECTANGLE;
            };

            return screen;
        };
    }
);
