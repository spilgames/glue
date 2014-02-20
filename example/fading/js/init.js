glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/movable',
        'glue/component/fadable'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Spritable,
        Movable,
        Fadable
    ) {
        'use strict';
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
                path: 'asset/',
                image: {
                    blocks: 'block-sheet.png'
                }
            }
        }, function () {
            var wasAtTarget = false,
                object = BaseObject(Spritable, Movable, Fadable).add({
                init: function () {
                    this.spritable.setup({
                        position: Vector(320, 300),
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
                    this.base.draw(deltaT, context);
                    this.fadable.draw(deltaT, context);
                }
            });

            Game.add(object);
        });
    }
);