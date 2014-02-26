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
            var object = BaseObject(Animatable, Draggable).add({
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
                                        startFrame: 0,
                                        endFrame: 7
                                    }
                                }
                            }
                        });
                        this.animatable.setAnimation('wiggleTail');
                    },
                    draw: function (deltaT, context, scroll) {
                        this.base.draw(deltaT, context, scroll);
                    }
                });
            return object;
        };
    }
);