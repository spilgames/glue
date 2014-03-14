glue.module.get(
    [
        'glue/game',
        'glue/math/dimension',
        'glue/loader',
        'glue/component/animatable',
        'glue/component/spritable',
        'glue/baseobject',
        'glue/math/vector'
    ],
    function (
        Game,
        Dimension,
        Loader,
        Animatable,
        Spritable,
        BaseObject,
        Vector) {
        'use strict';

        Game.setup({
            game: {
                name: 'Row Animation'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(1024, 768)
            },
            develop: {
                debug: true
            },
            asset: {
                path: 'asset/',
                image: {
                    spriteSheet: 'spritesheet.png'
                }
            }
        }, function () {
            var object = BaseObject(Animatable).add({
                init: function () {
                    object.animatable.setup({
                        position: Vector(410, 300),
                        image: Loader.getAsset('spriteSheet'),
                        animation: {
                            fps: 15,
                            frameWidth: 136,
                            frameHeight: 100,
                            animations: {
                                run: {
                                    startFrame: 0,
                                    endFrame: 7
                                }
                            }
                        }
                    });
                    object.animatable.setAnimation('run');
                }
            }),
                spriteSheet = BaseObject(Spritable).add({
                    init: function () {
                        spriteSheet.spritable.setup({
                            position: Vector(0, 0),
                            image: Loader.getAsset('spriteSheet')
                        });
                    }
                });

            Game.add(object);
            Game.add(spriteSheet);
        });
    }
);