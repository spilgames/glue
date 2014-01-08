glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/component/visible',
        'glue/component/collisionable',
        'glue/component/draggable',
        'glue/sat',
        'glue/baseobject'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Rectangle,
        Visible,
        Collisionable,
        Draggable,
        SAT,
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
            var obj1 = BaseObject(Visible, Collisionable, Draggable).add({
                    init: function () {
                        var dimension;
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 0
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.visible.getDimension();
                        this.visible.setOrigin({
                            x: dimension.width / 2,
                            y: dimension.height / 2
                        });
                    },
                    update: function (deltaT) {
                        this.collisionable.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        var circle = this.collisionable.getBoundingCircle();
                        this.visible.draw(deltaT, context);
                        context.beginPath();
                        context.arc(circle.x,circle.y,circle.radius,0 , 2 * Math.PI);
                        context.stroke();
                        context.closePath();
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
                }),
                obj2 = BaseObject(Visible, Collisionable).add({
                    init: function () {
                        var dimension;
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 300
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.visible.getDimension();
                        this.visible.setOrigin({
                            x: dimension.width / 2,
                            y: dimension.height / 2
                        });
                    },
                    update: function (deltaT) {
                        this.collisionable.update(deltaT);
                        SAT.collide(obj1, obj2, SAT.CIRCLE_TO_CIRCLE)

                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                });
            Game.add(obj1);
            Game.add(obj2);
        });
    }
);