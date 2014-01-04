glue.module.create(
    'js/objects/spil',
    [
        'glue/game',
        'glue/loader',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible',
        'glue/component/movable'
    ],
    function (
        Game,
        Loader,
        Vector,
        Component,
        Visible,
        Movable
    ) {
        return function () {
            var component = Component(Visible, Movable).add({
                    init: function () {
                        this.visible.setup({
                            position: Vector(400, 400),
                            image: Loader.getAsset('spil')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                };
            return component;
        };
    }
);
