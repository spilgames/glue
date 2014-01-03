glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/component',
        'glue/component/animatable',
        'glue/component/movable',
        'glue/component/scalable',
        'glue/component/rotatable',
        'glue/component/visible'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        Component,
        Animatable,
        Movable,
        Scalable,
        Rotatable,
        Visible
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Scaling'
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
            var component = Component(Animatable, Visible, Scalable, Movable).add({
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
                        this.scalable.setOrigin({
                            x: 35,
                            y: 35
                        });
                        this.scalable.setScale({
                            x: 8,
                            y: 8
                        });
                        this.scalable.setTarget({
                            x: 5,
                            y: 2
                        });
                        this.scalable.setSpeed(200);
                        this.movable.setTarget({
                            x: 0,
                            y: 0
                        });
                    },
                    update: function (deltaT) {
                        this.movable.update(deltaT);
                        this.scalable.update(deltaT);
                        if (this.scalable.atTarget()) {
                            component.scalable.setTarget({
                                x: 2,
                                y: 8
                            });
                        }
                        if (this.movable.atTarget()) {
                                this.movable.setTarget({
                                x: 300,
                                y: 300
                            });
                        }
                    },
                    draw: function (deltaT, context) {
                        this.animatable.draw(deltaT, context);
                    }
                });
            Game.add(component);
        });
    }
);