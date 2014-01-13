glue.module.create(
    'js/objects/tile',
    [
        'glue/loader',
        'glue/game',
        'glue/baseobject',
        'glue/component/visible',
        'glue/component/kineticable',
        'glue/component/scalable',
        'glue/math/vector',
        'js/level/gamescale'
    ],
    function (
        Loader,
        Game,
        BaseObject,
        Visible,
        Kineticable,
        Scalable,
        Vector,
        GameScale
    ) {
        return function (x, y) {
            var rect,
                deadZone = Game.canvas.getDimension(),
                object = BaseObject(Visible, Kineticable, Scalable).add({
                    init: function () {
                        this.scalable.setScale(GameScale);
                        this.visible.setup({
                            position: {
                                x: x,
                                y: y
                            },
                            image: Loader.getAsset('tile')
                        });
                        this.kineticable.setup({
                            dynamic: false
                        });
                        this.position = this.kineticable.getPosition();
                        this.bounds = this.kineticable.getDimension();
                        rect = this.kineticable.toRectangle();
                        this.active = true;
                    },
                    update: function (deltaT) {

                        this.kineticable.update(deltaT);
                        this.scalable.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        if (!this.active) return;
                        context.globalAlpha = this.alpha;
                        this.visible.draw(deltaT, context);
                        context.globalAlpha = 1.0;
                    }
                });
            return object;
        };
    }
);