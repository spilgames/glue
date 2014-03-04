glue.module.get(
    [
        'glue/game',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/baseobject',
        'glue/component/animatable',
        'glue/component/rotatable', 
        'glue/loader',
        'glue/math'
    ],
    function (
        Game,
        Vector,
        Dimension,
        BaseObject,
        Animatable,
        Rotatable,
        Loader,
        Mathematics) {
        'use strict';
        var math = Mathematics();

        Game.setup({
            game: {
                name: 'Rotated Animation'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(800, 600)
            },
            develop: {
                debug: true
            },
            asset: {
                path: 'asset/',
                image: {
                    enemy: 'enemy.png',
                    player: 'player.png'
                }
            }
        }, function () {
            var i,
                object,
                canvasSize = Game.canvas.getDimension();

            for (i = 0; i < 100; ++i) {
                object = BaseObject(Animatable, Rotatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: Vector(math.random(0, canvasSize.width), math.random(0, canvasSize.height)),
                            image: Loader.getAsset('player'),
                            animation: {
                                frameCount: 32,
                                fps: 8,
                                animations: {
                                    standUp: {
                                        startFrame: 0,
                                        endFrame: 0
                                    },
                                    standDown: {
                                        startFrame: 8,
                                        endFrame: 8
                                    },
                                    standLeft: {
                                        startFrame: 16,
                                        endFrame: 16
                                    },
                                    standRight: {
                                        startFrame: 24,
                                        endFrame: 24
                                    },
                                    walkUp: {
                                        startFrame: 0,
                                        endFrame: 6
                                    },
                                    walkDown: {
                                        startFrame: 0,
                                        endFrame: 14
                                    },
                                    walkLeft: {
                                        startFrame: 16,
                                        endFrame: 22
                                    },
                                    walkRight: {
                                        startFrame: 24,
                                        endFrame: 30
                                    }
                                }
                            }
                        });
                    },
                    draw: function (deltaT, context) {
                        this.base.draw(deltaT, context);
                    }
                });

                Game.add(object);
            }
        });
    }
);
