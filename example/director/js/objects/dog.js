glue.module.create(
    'js/objects/dog',
    [
        'glue/game',
        'glue/loader',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible',
        'glue/component/animatable',
        'glue/component/draggable'
    ],
    function (
        Game,
        Loader,
        Vector,
        Component,
        Visible,
        Animatable,
        Draggable
    ) {
        return function () {
            var component = Component(Visible, Animatable, Draggable).add({
                    init: function () {
                        this.setName('dog');
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
                        this.draggable.update(deltaT);
                    },
                    draw: function (deltaT, context, scroll) {
                        this.animatable.draw(deltaT, context, scroll);
                    },
                    pointerDown: function (e) {
                        this.draggable.pointerDown(e);
                    },
                    pointerMove: function (e) {
                        this.draggable.pointerMove(e);
                    },
                    pointerUp: function (e) {
                        this.draggable.pointerUp(e);
                    }
                });
            return component;
        };
    }
);
