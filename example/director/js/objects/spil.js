glue.module.create(
    'js/objects/spil',
    [
        'glue/game',
        'glue/loader',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/movable',
        'glue/component/droptarget',
        'glue/director'
    ],
    function (
        Game,
        Loader,
        Vector,
        BaseObject,
        Spritable,
        Movable,
        Droptarget,
        Director
    ) {
        return function () {
            var object = BaseObject(Spritable, Movable, Droptarget).add({
                    init: function () {
                        this.spritable.setup({
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
