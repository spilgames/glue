glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/rotatable'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Spritable,
        Rotatable
    ) {
        'use strict';

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
                path: 'asset/',
                image: {
                    logoLD: 'glue-logo-ld.png'
                }
            }
        }, function () {
            var object = BaseObject(Spritable, Rotatable).add({
                    init: function () {
                        var dimension;
                        this.spritable.setup({
                            position: Vector(300, 300),
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.getDimension();
                        this.setOrigin(Vector(dimension.width / 2, dimension.height / 2));
                        this.rotatable.setTargetDegree(360, true);
                        this.rotatable.setSpeed(100);
                    },
                    update: function (gameData) {
                        this.base.update(gameData);
                        if (this.rotatable.atTarget()) {
                            this.rotatable.setTargetDegree(0, false);
                        }
                    }
                });

            Game.add(object);
        });
    }
);