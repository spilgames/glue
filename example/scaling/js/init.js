glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/scalable',
        'glue/component/visible'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Scalable,
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
                path: 'asset/',
                image: {
                    logoLD: 'glue-logo-ld.png'
                }
            }
        }, function () {
            var object = BaseObject(Visible, Scalable).add({
                    init: function () {
                        var dimension;
                        this.visible.setup({
                            position: Vector(300, 300),
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.getDimension();
                        this.setOrigin({
                            x: dimension.width / 2,
                            y: dimension.height / 2
                        });
                        this.scalable.setTarget({
                            x: 2,
                            y: 2
                        });
                    },
                    update: function (deltaT) {
                        this.base.update(deltaT);
                        if (this.scalable.atTarget()) {
                            this.scalable.setTarget({
                                x: 1,
                                y: 1
                            });
                        }
                    },
                    draw: function (deltaT, context) {
                        this.base.draw(deltaT, context);
                    }
                });
            Game.add(object);
        });
    }
);