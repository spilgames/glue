glue.module.create(
    'js/objects/glue',
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
        var init = false;
        return function () {
            var component = Component(Visible, Movable, Droptarget).add({
                    init: function () {
                        if (!init) {
                            init = true;
                            this.visible.setup({
                                position: Vector(600, 400),
                                image: Loader.getAsset('glue')
                            });
                        }
                        this.droptarget.setup();
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    },
                    onDrop: function (obj, e) {
                        var position = this.visible.getPosition();
                        if (position.x === 200) {
                            this.visible.setPosition(Vector(
                                600,
                                400
                            ));
                        } else {
                            this.visible.setPosition(Vector(
                                position.x - 100,
                                position.y - 100
                            ));
                        }
                        if (obj.getName && obj.getName() === 'dog') {
                            Director.showScreen('Screen2');
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
