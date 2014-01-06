glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/component/visible',
        'glue/component/physics',
        'glue/component/collidable',
        'glue/component/draggable',
        'glue/collision',
        'glue/baseobject'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Rectangle,
        Visible,
        Physics,
        Collidable,
        Draggable,
        Collision,
        BaseObject
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Separation'
            },
            canvas: {
                id: 'canvas',
                dimension: Dimension(800, 600)
            },
            develop: {
                debug: true
            },
            asset: {
                image: {
                    path: 'asset/',
                    source: {
                        logoLD: 'glue-logo-ld.png'
                    }
                }
            }
        }, function () {
            var isDown = false,
                mouse = {
                    x: 0,
                    y: 0
                },
                obj1 = BaseObject(Visible, Physics, Collidable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: -200
                            },
                            image: Loader.getAsset('logoLD')
                        });

                        this.collidable.setBounce(0.6);

                        this.physics.setAcceleration({
                            y: .5
                        });
                    },
                    update: function (deltaT) {
                        this.collidable.update(deltaT);
                        this.physics.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                }),
                obj2 = BaseObject(Visible, Collidable, Draggable, Physics).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 500
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.collidable.setFixed(true);
                        this.physics.setVelocity({
                            y: -.5
                        });
                    },
                    update: function (deltaT) {
                        this.collidable.update(deltaT);
                        this.physics.update();
                        
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    },
                    pointerDown: function (e) {
                        this.draggable.pointerDown(e);
                    },
                    pointerMove: function (e) {
                        this.draggable.pointerMove(e);
                    },
                    pointerUp: function (e) {
                        this.draggable.pointerUp(e);
                    }
                });
            
            Collision.add(obj1);
            Collision.add(obj2);

            Game.add(Collision);
            Game.add(obj1);
            Game.add(obj2);
        });
    }
);