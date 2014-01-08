glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/component/visible',
        'glue/component/gravitatable',
        'glue/component/collidable',
        'glue/component/draggable',
        'glue/component/clickable',
        'glue/sat',
        'glue/baseobject',
        'glue/math',
        'glue/math/vector'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Rectangle,
        Visible,
        Gravitatable,
        Collidable,
        Draggable,
        Clickable,
        SAT,
        BaseObject,
        Mathematics,
        Vector
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Group Collision'
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
                        logoLD: 'glue-logo-ld.png',
                        ball: 'ball.png',
                        button: 'button.png'
                    }
                }
            }
        }, function () {
            var math = Mathematics(),
                collisionType = SAT.RECTANGLE_TO_RECTANGLE,
                button = BaseObject(Visible, Clickable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 0
                            },
                            image: Loader.getAsset('button')
                        });
                        
                    },
                    draw: function (deltaT, context) {
                        var position = this.visible.getPosition(),
                            value = collisionType === SAT.RECTANGLE_TO_RECTANGLE ? 'RECT Collision' : 'CIRCLE Collision';
                        this.visible.draw(deltaT, context);
                        context.font = '20px Verdana';
                        context.fillText(value, position.x + 30, position.y + 30);
                    },
                    pointerDown: function (e) {
                        this.clickable.pointerDown(e);
                    },
                    onClick: function (e) {
                        if (collisionType === SAT.RECTANGLE_TO_RECTANGLE) {
                            collisionType = SAT.CIRCLE_TO_CIRCLE;
                        } else {
                            collisionType = SAT.RECTANGLE_TO_RECTANGLE;
                        }
                    }
                }),
                obj1 = BaseObject(Visible, Collidable, Draggable).add({
                    init: function () {
                        var dimension;
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 400
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        dimension = this.visible.getDimension();
                       
                        this.collidable.setStatic(true);
                    },
                    update: function (deltaT) {
                        this.collidable.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        var bound;
                        this.visible.draw(deltaT, context);
                        if (collisionType === SAT.CIRCLE_TO_CIRCLE) {
                            bound = this.collidable.getBoundingCircle();
                            context.beginPath();
                            context.arc(bound.x, bound.y, bound.radius, 0, Math.PI * 2);
                            context.stroke();
                            context.closePath();
                        } else {
                            bound = this.collidable.getBoundingBox();
                            context.strokeRect(bound.x1, bound.y1, bound.x2, bound.y2);
                        }
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
                group = [],
                i,
                obj;
            Game.add(obj1);
            for (i = 0; i < 100; ++i) {
                obj = BaseObject(Visible, Collidable, Gravitatable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: math.random(0, Game.canvas.getDimension().width),
                                y: math.random(-10, 0)
                            },
                            image: Loader.getAsset('ball')
                        });
                        this.gravitatable.setGravity(Vector(
                            0,
                            0.5
                        ));

                        this.gravitatable.setVelocity(Vector(
                            math.random(-10, 10),
                            0
                        ));

                        this.gravitatable.setMaxVelocity(Vector(
                            0,
                            20
                        ));
                        this.gravitatable.setBounce(Vector(
                            1,
                            0.6
                        ));
                        this.collidable.setBoundingCircleRadius(25);
                    },
                    update: function (deltaT) {
                        var position = this.visible.getPosition(),
                            size = this.visible.getDimension(),
                            canvasSize = Game.canvas.getDimension();
                        if (position.y > canvasSize.height) {
                            position.y = -size.height;
                        }
                        if (position.x > canvasSize.width) {
                            position.x = -size.width;
                        } else if (position.x + size.width < 0){
                            position.x = canvasSize.width;
                        }
                        this.visible.setPosition(position);
                        this.gravitatable.update(deltaT);
                        this.collidable.update(deltaT);
                        SAT.collide(obj1, this, collisionType);
                    },
                    draw: function (deltaT, context) {
                        var bound;
                        this.visible.draw(deltaT, context);
                        if (collisionType === SAT.CIRCLE_TO_CIRCLE) {
                            bound = this.collidable.getBoundingCircle();
                            context.beginPath();
                            context.arc(bound.x, bound.y, bound.radius, 0, Math.PI * 2);
                            context.stroke();
                            context.closePath();
                        } else {
                            bound = this.collidable.getBoundingBox();
                            context.strokeRect(bound.x1, bound.y1, bound.x2, bound.y2);
                        }
                    }
                });
                group.push(obj);
                Game.add(obj);
            }
            Game.add(button);
        });
    }
);