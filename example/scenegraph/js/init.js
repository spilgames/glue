glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/rotatable',
        'glue/component/scalable'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Vector,
        BaseObject,
        Spritable,
        Rotatable,
        Scalable
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
            var object1 = BaseObject(Spritable, Rotatable, Scalable).add({
                    init: function () {
                        var dimension;
                        this.spritable.setup({
                            position: Vector(300, 300),
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.getDimension();
                        this.setOrigin(Vector(dimension.width / 2, dimension.height / 2));
                        this.rotatable.setTargetDegree(360, true);
                        this.rotatable.setSpeed(0.01);
                        this.scalable.setTarget(Vector(0.5, 0.5));
                    },
                    update: function (deltaT) {
                        this.base.update(deltaT);
                        if (this.rotatable.atTarget()) {
                            this.rotatable.setTargetDegree(0, false);
                            this.scalable.setTarget(Vector(1, 1));
                        }
                    }
                }),
                object2 = BaseObject(Spritable, Rotatable, Scalable).add({
                    init: function () {
                        var dimension;
                        this.spritable.setup({
                            position: Vector(200, 200),
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.getDimension();
                        this.setOrigin(Vector(dimension.width / 2, dimension.height / 2));
                        this.rotatable.setTargetDegree(360, true);
                        this.rotatable.setSpeed(0.01);
                        this.scalable.setTarget(Vector(0.5, 0.5));
                    },
                    update: function (deltaT) {
                        // 'this' refers to object1 (the parent of object2)
                        object2.base.update(deltaT);
                        if (object2.rotatable.atTarget()) {
                            object2.rotatable.setTargetDegree(0, false);
                        }
                    }
                }),
                object3 = BaseObject(Spritable, Rotatable, Scalable).add({
                    init: function () {
                        var dimension;
                        this.spritable.setup({
                            position: Vector(200, 200),
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.getDimension();
                        this.setOrigin(Vector(dimension.width / 2, dimension.height / 2));
                        this.rotatable.setTargetDegree(360, true);
                        this.rotatable.setSpeed(0.01);
                        this.scalable.setTarget(Vector(0.5, 0.5));
                    },
                    update: function (deltaT) {
                        // 'this' refers to object2 (the parent of object3)
                        object3.base.update(deltaT);
                        if (object3.rotatable.atTarget()) {
                            object3.rotatable.setTargetDegree(0, false);
                        }
                    }
                });

                object1.addChild(object2);
                object2.addChild(object3);

            Game.add(object1);
        });
    }
);