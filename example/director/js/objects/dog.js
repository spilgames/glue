glue.module.create(
    'js/objects/dog',
    [
        'glue/game',
        'glue/loader',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/animatable',
        'glue/component/draggable'
    ],
    function (
        Game,
        Loader,
        Vector,
        BaseObject,
        Spritable,
        Animatable,
        Draggable
    ) {
        return function () {
            var object = BaseObject(Spritable, Animatable, Draggable).add({
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
                    draw: function (deltaT, context, scroll) {
                        this.animatable.draw(deltaT, context, scroll);
                    }
                });
            return object;
        };
    }
);