glue.module.create(
    'js/objects/glue',
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
            var init = false,
                dropped = false,
                object = BaseObject(Visible, Movable, Droptarget).add({
                    init: function () {
                        if (!init) {
                            init = true;
                            this.visible.setup({
                                position: Vector(600, 400),
                                image: Loader.getAsset('glue')
                            });
                            this.movable.setMoveSpeed(200);
                        }
                        this.droptarget.setup();
                    },
                    update: function (deltaT) {
                        this.movable.update(deltaT);
                        if (dropped && this.movable.atTarget()) {
                            Director.showScreen('Screen2');
                            dropped = false;
                        }
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    },
                    onDrop: function (obj, e) {
                        var position = this.visible.getPosition();
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
