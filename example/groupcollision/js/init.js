glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/component/visible',
        'glue/component/kineticable',
        'glue/component/draggable',
        'glue/component/clickable',
        'glue/component/scalable',
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
        Kineticable,
        Draggable,
        Clickable,
        Scalable,
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
                buttonPosition,
                button = BaseObject(Visible, Clickable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 0
                            },
                            image: Loader.getAsset('button')
                        });
                        buttonPosition = this.visible.getPosition();
                    },
                    draw: function (deltaT, context) {
                        var value = collisionType === SAT.RECTANGLE_TO_RECTANGLE ? 'RECT Collision' : 'CIRCLE Collision';
                        this.visible.draw(deltaT, context);
                        context.font = '20px Verdana';
                        context.fillText(value, buttonPosition.x + 30, buttonPosition.y + 30);
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
                obj1 = BaseObject(Visible, Kineticable, Draggable, Scalable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 400
                            },
                            image: Loader.getAsset('logoLD')
                        });
                        this.kineticable.setup({
                            dynamic: false
                        });
                        this.scalable.setTarget(Vector(4, 4));
                    },
                    update: function (deltaT) {
                        this.scalable.update(deltaT);
                        this.kineticable.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        var bound;
                        this.visible.draw(deltaT, context);
                        if (collisionType === SAT.CIRCLE_TO_CIRCLE) {
                            bound = this.kineticable.toCircle();
                            context.beginPath();
                            context.arc(bound.x, bound.y, bound.radius, 0, Math.PI * 2);
                            context.stroke();
                            context.closePath();
                        } else {
                            bound = this.kineticable.toRectangle();
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
                obj = BaseObject(Visible, Kineticable).add({
                    init: function () {
                        // visible config
                        this.visible.setup({
                            position: {
                                x: math.random(0, Game.canvas.getDimension().width),
                                y: math.random(-10, 0)
                            },
                            image: Loader.getAsset('ball')
                        });

                        // kineticable config
                        this.kineticable.setup({
                            gravity: Vector(0, 0.5),
                            bounce: 0.6,
                            velocity: Vector(math.random(-10, 10), 0),
                            maxVelocity: Vector(0, 20),
                            radius: 25
                        });

                        // assign object variables
                        this.position = this.kineticable.getPosition();
                        this.size = this.kineticable.getDimension();
                        this.canvasSize = Game.canvas.getDimension();
                    },
                    update: function (deltaT) {
                        if (this.position.y > this.canvasSize.height) {
                            this.position.y = -this.size.height;
                        }
                        if (this.position.x > this.canvasSize.width) {
                            this.position.x = -this.size.width;
                        } else if (this.position.x + this.size.width < 0){
                            this.position.x = this.canvasSize.width;
                        }
                        
                        this.kineticable.update(deltaT);
                        SAT.collide(obj1, this, collisionType);
                    },
                    draw: function (deltaT, context) {
                        var bound;
                        this.visible.draw(deltaT, context);
                        if (collisionType === SAT.CIRCLE_TO_CIRCLE) {
                            bound = this.kineticable.toCircle();
                            context.beginPath();
                            context.arc(bound.x, bound.y, bound.radius, 0, Math.PI * 2);
                            context.stroke();
                            context.closePath();
                        } else {
                            bound = this.kineticable.toRectangle();
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