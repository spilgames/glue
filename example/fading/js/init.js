glue.module.get(
    [
        'glue/domready',
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/component',
        'glue/component/visible',
        'glue/component/movable',
        'glue/component/fadable'
    ],
    function (
        Domready,
        Game,
        Loader,
        Dimension,
        Vector,
        Component,
        Visible,
        Movable,
        Fadable
    ) {
        'use strict';
        Domready(function () { 
            Game.setup({
                game: {
                    name: 'Fading'
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
                var wasAtTarget = false,
                    component = Component(Visible, Movable, Fadable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 320,
                                y: 300
                            },
                            image: Loader.getAsset('blocks')
                        });
                        this.movable.setMoveSpeed(150);
                        this.movable.setTarget(Vector(0, 0));
                        this.fadable.setFadeSpeed(0.4);
                        this.fadable.fadeIn();
                    },
                    update: function (deltaT) {
                        this.movable.update(deltaT);
                        this.fadable.update(deltaT);
                        if (this.movable.atTarget() && !wasAtTarget) {
                            this.fadable.fadeOut();
                            wasAtTarget = true;
                        }
                    },
                    draw: function (deltaT, context) {
                        context = this.fadable.draw(context);
                        this.visible.draw(deltaT, context);
                    }
                });

                Game.add(component);
            });
        });
    }
);