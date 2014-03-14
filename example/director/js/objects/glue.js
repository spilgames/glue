glue.module.create(
    'js/objects/glue',
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
            var init = false,
                dropped = false,
                object = BaseObject(Spritable, Movable, Droptarget).add({
                    init: function () {
                        if (!init) {
                            init = true;
                            this.spritable.setup({
                                position: Vector(600, 400),
                                image: Loader.getAsset('glue')
                            });
                            this.movable.setMoveSpeed(200);
                            this.droptarget.setup();
                        }
                    },
                    update: function (gameData) {
                        this.base.update(gameData);
                        if (dropped && this.movable.atTarget()) {
                            Director.showScreen('Screen2');
                            dropped = false;
                        }
                    },
                    onDrop: function (obj, e) {
                        var position = this.getPosition();
                        if (position.x === 200) {
                            this.movable.setTarget(Vector(
                                600,
                                400
                            ));
                        } else {
                            this.movable.setTarget(Vector(
                                position.x - 100,
                                position.y - 100
                            ));
                        }
                        dropped = true;
                    },
                    destroy: function () {
                        this.droptarget.destroy();
                    }
                });
            return object;
        };
    }
);
