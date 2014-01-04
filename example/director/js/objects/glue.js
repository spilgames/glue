glue.module.create(
    'js/objects/glue',
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
                            position: Vector(600, 400),
                            image: Loader.getAsset('glue')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                });
            return component;
        };
    }
);
