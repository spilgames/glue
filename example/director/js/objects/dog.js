glue.module.create(
    'js/objects/dog',
    [
        'glue/game',
        'glue/loader',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible',
        'glue/component/animatable',
        'glue/component/movable'
    ],
    function (
        Game,
        Loader,
        Vector,
        Component,
        Visible,
        Animatable,
        Movable
    ) {
        return function () {
            var component = Component(Visible, Animatable, Movable).add({
                    init: function () {
                        this.animatable.setup({
                            position: Vector(50, 400),
                            image: Loader.getAsset('dog'),
                            animation: {
                                frameCount: 8,
                                fps: 8,
                                animations: {
                                    wiggleTail: {
                                        startFrame: 1,
                                        endFrame: 8
                                    }
                                }
                            }
                        });
                        this.animatable.setAnimation('wiggleTail');
                    },
                    update: function (deltaT, context) {
                        this.animatable.update(deltaT);
                    },
                    draw: function (deltaT, context, scroll) {
                        this.animatable.draw(deltaT, context, scroll);
                    }
                });
            return component;
        };
    }
);
