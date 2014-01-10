glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/component/visible',
        'glue/component/gravitatable',
        'glue/component/collidable',
        'glue/component/draggable',
        'glue/sat',
        'glue/baseobject',
        'glue/math',
        'glue/math/vector'
    ],
    function (
        Game,
        Loader,
        Dimension,
        Visible,
        Gravitatable,
        Collidable,
        Draggable,
        SAT,
        BaseObject,
        Mathematics,
        Vector
    ) {
        'use strict';

        Game.setup({
            game: {
                name: 'Group VS Group'
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
                        ball: 'ball.png',
                        ball2: 'ball2.png',
                        logo: 'glue.png'
                    }
                }
            }
        }, function () {
            var math = Mathematics(),
                collisionType = SAT.CIRCLE_TO_CIRCLE,//SAT.RECTANGLE_TO_RECTANGLE,
                group1 = [],
                group2 = [],
                i,
                logo = BaseObject(Visible, Collidable, Draggable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 300
                            },
                            image: Loader.getAsset('logo')
                        });
                        this.collidable.setStatic(true);
                        this.collidable.setup();
                    },
                    update: function (deltaT) {
                        this.collidable.update(deltaT);
                        SAT.collideGroup(this, group1, collisionType);
                        SAT.collideGroup(this, group2, collisionType);
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
        
            Game.add(logo);

            for (i = 0; i < 20; ++i) {
                var obj1 = BaseObject(Visible, Gravitatable, Collidable).add({
                        init: function () {
                            // visible config
                            this.visible.setup({
                                position: {
                                    x: math.random(0, Game.canvas.getDimension().width - 25),
                                    y: 0
                                },
                                image: Loader.getAsset('ball')
                            });

                            // gravitatable config
                            this.gravitatable.setup({
                                gravity: Vector(0, 0.5),
                                bounce: Vector(1, 0.6),
                                velocity: Vector(-10, -10),
                                maxVelocity: Vector(0, 20)
                            });

                            // collidable config
                            this.collidable.setBoundingCircleRadius(25);
                            this.collidable.setup();
                        },
                        update: function (deltaT) {
                            var position = this.visible.getPosition(),
                                bound = this.collidable.getBoundingCircle(),
                                dim = Game.canvas.getDimension();

                            if (position.y - bound.radius > dim.height ) {
                                position.y = -50;
                                position.x = math.random(0, Game.canvas.getDimension().width - 25);
                            }
                            this.gravitatable.update(deltaT);
                            this.collidable.update(deltaT);
                            SAT.collideGroup(this, group1, collisionType);
                            SAT.collideGroup(this, group2, collisionType);
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    }),
                    obj2 = BaseObject(Visible, Gravitatable, Collidable).add({
                        init: function () {
                            // visible config
                            this.visible.setup({
                                position: {
                                    x: math.random(0, Game.canvas.getDimension().width - 25),
                                    y: Game.canvas.getDimension().height - 25
                                },
                                image: Loader.getAsset('ball2')
                            });

                            // gravitatable config
                            this.gravitatable.setup({
                                gravity: Vector(0, 0.5),
                                bounce: Vector(1, 0.6),
                                velocity: Vector(-10, -10),
                                maxVelocity: Vector(0, 20)
                            });

                            this.collidable.setBoundingCircleRadius(25);
                            this.collidable.setup();
                        },
                        update: function (deltaT) {
                            var dim = Game.canvas.getDimension(),
                                bound = this.collidable.getBoundingCircle(),
                                position = this.visible.getPosition();
                            if (position.y - bound.radius > dim.height ) {
                                position.y = -50;
                                position.x = math.random(0, Game.canvas.getDimension().width - 25);
                            } 

                            this.gravitatable.update(deltaT);
                            this.collidable.update(deltaT);
                            SAT.collideGroup(this, group1, collisionType);
                            SAT.collideGroup(this, group2, collisionType);;
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    });

                group1.push(obj1);
                group2.push(obj2);
                Game.add(obj1);
                Game.add(obj2);
            }
        });
    }
);