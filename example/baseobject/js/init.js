glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/component/spritable',
        'glue/component/kineticable',
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
        Spritable,
        Kineticable,
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
                path: 'asset/',
                image: {
                    logoLD: 'glue-logo-ld.png',
                    ball: 'ball.png',
                    button: 'button.png'
                }
            }
        }, function () {
            var math = Mathematics(),
                collisionType = SAT.RECTANGLE_TO_RECTANGLE,
                buttonPosition1,
                buttonPosition2,
                button1 = BaseObject(Spritable, Clickable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 250,
                                y: 0
                            },
                            image: Loader.getAsset('button')
                        });
                        buttonPosition1 = this.getPosition();
                    },
                    draw: function (gameData) {
                        var context = gameData.context,
                            value = obj1.isActive() ? (obj1.getName() + 'ACTIVE') : (obj1.getName() + 'INACTIVE');
                        this.base.draw(gameData);
                        context.font = '20px Verdana';
                        context.fillText(value, buttonPosition1.x + 30, buttonPosition1.y + 30);
                    },
                    onClick: function (e) {
                        obj1.setActive(!obj1.isActive());
                    }
                }),
                button2 = BaseObject(Spritable, Clickable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 500,
                                y: 0
                            },
                            image: Loader.getAsset('button')
                        });
                        buttonPosition2 = this.getPosition();
                    },
                    draw: function (gameData) {
                        var context = gameData.context,
                            value = obj1.isVisible() ? (obj1.getName() + 'VISIBLE') : (obj1.getName() + 'INVISIBLE');
                        this.base.draw(gameData);
                        context.font = '20px Verdana';
                        context.fillText(value, buttonPosition2.x + 30, buttonPosition2.y + 30);
                    },
                    onClick: function (e) {
                        obj1.setVisible(!obj1.isVisible());
                    }
                }),
                obj1 = BaseObject(Spritable, Kineticable, Draggable).add({
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
                    },
                    draw: function (gameData) {
                        var bound,
                            context = gameData.context;

                        this.base.draw(gameData);
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
                }),
                group = [],
                i,
                obj;
            obj1.setName('Collider');
            Game.add(obj1);
            for (i = 0; i < 100; ++i) {
                obj = BaseObject(Spritable, Kineticable).add({
                    init: function () {
                        // spritable config
                        this.spritable.setup({
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
                    update: function (gameData) {
                        if (this.position.y > this.canvasSize.height) {
                            this.position.y = -this.size.height;
                        }
                        if (this.position.x > this.canvasSize.width) {
                            this.position.x = -this.size.width;
                        } else if (this.position.x + this.size.width < 0){
                            this.position.x = this.canvasSize.width;
                        }
                        
                        this.base.update(gameData);
                        SAT.collide(obj1, this, collisionType);
                    },
                    draw: function (gameData) {
                        var bound,
                            context = gameData.context;

                        this.base.draw(gameData);
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
            Game.add(button1);
            Game.add(button2);
        });
    }
);