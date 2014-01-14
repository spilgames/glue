glue.module.create(
    'js/screens/menu',
    [
        'glue/game',
        'glue/screen',
        'glue/director',
        'glue/baseobject',
        'glue/loader',
        'glue/component/visible',
        'glue/component/scalable',
        'glue/math/vector'
    ],
    function (
        Game,
        Screen,
        Director,
        BaseObject,
        Loader,
        Visible,
        Scalable,
        Vector
    ) {
        return function () {
            var screen = Screen('Menu'),
                logo = BaseObject(Visible, Scalable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 80,
                                y: 160
                            },
                            image: Loader.getAsset('logo')
                        });
                        this.scalable.setScale(Vector(8, 8));
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                });
                canvasDimension = Game.canvas.getDimension();
            screen.update = function (deltaT) {

            };
            screen.draw = function (deltaT, context) {
                context.fillStyle = '#000';
                context.fillRect(0, 0, canvasDimension.width, canvasDimension.height);
                context.imageSmoothingEnabled = false;        
                context.mozImageSmoothingEnabled = false;
                context.oImageSmoothingEnabled = false;
                context.webkitImageSmoothingEnabled = false;
                context.fillStyle = '#bc3a3a';
                context.textAlign = 'center';
                context.font = '40px Verdana';
                context.fillText('Click to Play!', canvasDimension.width / 2, canvasDimension.height / 2 + 40);
            };

            screen.pointerDown = function (e) {
                Director.showScreen('Play');
            };

            screen.addObject(logo);

            return screen;
        };
    }
);
