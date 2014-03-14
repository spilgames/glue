glue.module.get(
    [
        'glue/game',
        'glue/math/dimension',
        'glue/math/vector',
        'glue/loader',
        'glue/baseobject',
        'glue/component/spritable'
    ],
    function (
        Game,
        Dimension,
        Vector,
        Loader,
        BaseObject,
        Spiteable) {
        'use strict';

        Game.setup({
            game: {
                name: 'z-index example'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(1024, 768)
            },
            develop: {
                debug: true
            },
            sort: true,
            sortType: Game.SORT_TYPE_STABLE,
            asset: {
                path: '../',
                image: {
                    object1: 'dog-sit.png',
                    object2: 'glue-logo.png',
                    object3: 'spil-logo.png',
                    object4: 'target.jpg'
                }
            }
        }, function () {
            var object1 = BaseObject(Spiteable).add({
                    init: function () {
                        this.spritable.setup({
                            image: Loader.getAsset('object1')
                        });
                        this.z = 40;
                    }
                }),
                object2 = BaseObject(Spiteable).add({
                    init: function () {
                        this.spritable.setup({
                            image: Loader.getAsset('object2'),
                            position: Vector(50, 150)
                        });
                        this.z = 20;
                    }
                }),
                object3 = BaseObject(Spiteable).add({
                    init: function () {
                        this.spritable.setup({
                            image: Loader.getAsset('object3'),
                            position: Vector(50, 200)
                        });
                        this.z = 30;
                    }
                }),
                object4 = BaseObject(Spiteable).add({
                    init: function () {
                        this.spritable.setup({
                            image: Loader.getAsset('object4')
                        });
                        this.z = 10;
                    }
                });

            Game.add(object1);
            Game.add(object2);
            Game.add(object3);
            Game.add(object4);
        });
    }
);
