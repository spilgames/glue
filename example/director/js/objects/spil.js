glue.module.create(
    'js/objects/spil',
    [
        'glue/game',
        'glue/loader',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/visible',
        'glue/component/movable',
        'glue/component/droptarget',
        'glue/director'
    ],
    function (
        Game,
        Loader,
        Vector,
        BaseObject,
        Visible,
        Movable,
        Droptarget,
        Director
    ) {
        return function () {
            var object = BaseObject(Visible, Movable, Droptarget).add({
                    init: function () {
                        this.visible.setup({
                            position: Vector(400, 400),
                            image: Loader.getAsset('spil')
                        });
                        this.droptarget.setup();
                    },
                    onDrop: function (object, e) {
                        if (object.getName && object.getName() === 'dog') {
                            Director.showScreen('Screen1');
                        }
                    },
                    destroy: function () {
                        this.droptarget.destroy();
                    }
                });
            return object;
        };
    }
);
