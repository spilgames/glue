glue.module.create(
    'js/objects/spil',
    [
        'glue/game',
        'glue/loader',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible',
        'glue/component/movable',
        'glue/component/droptarget',
        'glue/director'
    ],
    function (
        Game,
        Loader,
        Vector,
        Component,
        Visible,
        Movable,
        Droptarget,
        Director
    ) {
        return function () {
            var component = Component(Visible, Movable, Droptarget).add({
                    init: function () {
                        this.visible.setup({
                            position: Vector(400, 400),
                            image: Loader.getAsset('spil')
                        });
                        this.droptarget.setup();
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    },
                    onDrop: function (obj, e) {
                        if (obj.getName && obj.getName() === 'dog') {
                            Director.showScreen('Screen1');
                        }
                    },
                    destroy: function () {
                        this.droptarget.destroy();
                    }
                });
            return component;
        };
    }
);
