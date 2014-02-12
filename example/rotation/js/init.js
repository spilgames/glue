glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/visible',
        'glue/component/rotatable'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Visible,
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
            var object = BaseObject(Visible, Rotatable).add({
                    init: function () {
                        var dimension;
                        this.visible.setup({
                            position: {
                                x: 300,
                                y: 300
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.visible.getDimension();
                        this.rotatable.setOrigin({
                            x: dimension.width / 2,
                            y: dimension.height / 2
                        });
                        this.rotatable.setTargetDegree(360, true);
                        this.rotatable.setSpeed(100);
                    },
                    update: function (deltaT) {
                        this.base.update(deltaT);
                        if (this.rotatable.atTarget()) {
                            this.rotatable.setTargetDegree(0, false);
                        }
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                });

            Game.add(object);
        });
    }
);