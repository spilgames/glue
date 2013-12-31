glue.module.get(
    [
        'glue/domready',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible',
        'glue/component/animatable',
        'glue/component/movable',
        'glue/component/rotatable'
    ],
    function (
        Domready,
        Game,
        Loader,
        Dimension,
        Vector,
        Component,
        Visible,
        Animatable,
        Movable,
        Rotatable
    ) {
        'use strict';
        Domready(function () { 
            Game.setup({
                game: {
                    name: 'Rotation'
                },
                canvas: {
                    id: 'canvas',
                    dimension: Dimension(600, 600)
                },
                develop: {
                    debug: true
                },
                asset: {
                    image: {
                        path: 'asset/',
                        source: {
                            blocks: 'block-sheet.png'
                        }
                    }
                }
            }, function () {
                var component = Component(Visible, Animatable, Movable, Rotatable).add({
                        init: function () {
                            this.animatable.setup({
                                position: {
                                    x: 300,
                                    y: 300
                                },
                                animation: {
                                    frameCount: 4,
                                    fps: 0,
                                    animations: {
                                        yellow: {
                                            startFrame: 1,
                                            endFrame: 1
                                        },
                                        blue: {
                                            startFrame: 2,
                                            endFrame: 2
                                        },
                                        green: {
                                            startFrame: 3,
                                            endFrame: 3
                                        },
                                        red: {
                                            startFrame: 4,
                                            endFrame: 4
                                        }
                                    }
                                },
                                image: Loader.getAsset('blocks')
                            });
                            this.animatable.setAnimation('yellow');
                            this.rotatable.setOrigin({
                                x: 35,
                                y: 35
                            });
                            this.rotatable.setTargetDegree(90, true);
                            this.rotatable.setSpeed(50);
                            this.movable.setTarget(Vector(
                                0,
                                0
                            ));
                        },
                        update: function (deltaT) {
                            this.movable.update(deltaT);
                            this.rotatable.update(deltaT);
                        },
                        draw: function (deltaT, context) {
                            this.animatable.draw(deltaT, context);
                        }
                    });
                Game.add(component);
            });
        });
    }
);