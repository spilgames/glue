glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/math/vector',
        'glue/component/spritable',
        'glue/component/kineticable',
        'glue/component/draggable',
        'glue/sat',
        'glue/baseobject'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Rectangle,
        Vector,
        Spritable,
        Kineticable,
        Draggable,
        SAT,
        BaseObject
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Gravity'
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
                    logoLD: 'glue-logo-ld.png'
                }
            }
        }, function () {
            var obj1 = BaseObject(Spritable, Kineticable, Draggable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 400,
                                y: 400
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.kineticable.setup({
                            dynamic: false
                        });
                    }
                }),
                position,
                obj2 = BaseObject(Spritable, Kineticable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 400,
                                y: 0
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.kineticable.setup({
                            gravity: Vector(0, 0.5),
                            bounce: 0.4,
                            maxVelocity: Vector(0, 20)
                        });
                        position = this.kineticable.getPosition();
                    },
                    update: function (deltaT) {
                        if (position.y > Game.canvas.getDimension().height) {
                            position.y = -this.getDimension().height;
                        }
                        this.base.update(deltaT);
                        SAT.collide(obj1, obj2);
                    }
                });

            Game.add(obj1);
            Game.add(obj2);
        });
    }
);