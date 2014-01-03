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
            var component = Component(Animatable, Visible, Scalable, Movable, Rotatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 310,
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
                        
                        this.visible.setOrigin({
                            x: 35,
                            y: 35
                        });

                        this.scalable.setTarget({
                            x: 2,
                            y: 2
                        });

                        this.rotatable.setTargetDegree(180);
                    },
                    update: function (deltaT) {
                        this.movable.update(deltaT);
                        this.scalable.update(deltaT);
                        this.rotatable.update(deltaT);
                        if (this.scalable.atTarget()) {
                            this.scalable.setTarget({
                                x: 8,
                                y: 1
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