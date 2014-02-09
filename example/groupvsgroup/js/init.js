glue.module.get(
    [
        'glue/game',
        'glue/loader',
        'glue/math/dimension',
        'glue/component/visible',
        'glue/component/kineticable',
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
        Kineticable,
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
                path: 'asset/',
                image: {
                    ball: 'ball.png',
                    ball2: 'ball2.png',
                    logo: 'glue.png'
                }
            }
        }, function () {
            var math = Mathematics(),
                collisionType = SAT.CIRCLE_TO_CIRCLE,//SAT.RECTANGLE_TO_RECTANGLE,
                group1 = [],
                group2 = [],
                i,
                logo = BaseObject(Visible, Kineticable, Draggable).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 400,
                                y: 300
                            },
                            image: Loader.getAsset('logo')
                        });
                        this.kineticable.setup({
                            dynamic: false
                        });
                    },
                    update: function (deltaT) {
                        this.kineticable.update(deltaT);
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
                var obj1 = BaseObject(Visible, Kineticable).add({
                        init: function () {
                            // visible config
                            this.visible.setup({
                                position: {
                                    x: math.random(0, Game.canvas.getDimension().width - 25),
                                    y: 0
                                },
                                image: Loader.getAsset('ball')
                            });

                            // kineticable config
                            this.kineticable.setup({
                                gravity: Vector(0, 0.5),
                                bounce: 0.6,
                                velocity: Vector(math.random(-10, 10), 0),
                                maxVelocity: Vector(0, 20),
                                radius: 22
                            });
                            this.position = this.kineticable.getPosition();
                            this.bound = this.kineticable.toCircle();
                            this.dimension = this.kineticable.getDimension();
                            this.canvasSize = Game.canvas.getDimension();
                        },
                        update: function (deltaT) {
                            if (this.position.y > this.canvasSize.height) {
                                this.position.y = -this.dimension.height;
                            }
                            if (this.position.x > this.canvasSize.width) {
                                this.position.x = -this.dimension.width;
                            } else if (this.position.x + this.dimension.width < 0){
                                this.position.x = this.canvasSize.width;
                            }

                            this.kineticable.update(deltaT);
                            // Check Collision Here

                            SAT.collideGroup(this, group1, collisionType);
                            SAT.collideGroup(this, group2, collisionType);
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    }),
                    obj2 = BaseObject(Visible, Kineticable).add({
                        init: function () {
                            // visible config
                            this.visible.setup({
                                position: {
                                    x: math.random(0, Game.canvas.getDimension().width - 25),
                                    y: Game.canvas.getDimension().height - 25
                                },
                                image: Loader.getAsset('ball2')
                            });

                            // kineticable config
                            this.kineticable.setup({
                                gravity: Vector(0, 0.5),
                                bounce: 0.6,
                                velocity: Vector(math.random(-10, 10), 0),
                                maxVelocity: Vector(0, 20),
                                radius: 22
                            });
                            this.position = this.kineticable.getPosition();
                            this.bound = this.kineticable.toCircle();
                            this.dimension = this.kineticable.getDimension();
                            this.canvasSize = Game.canvas.getDimension()
                        },
                        update: function (deltaT) {
                            if (this.position.y > this.canvasSize.height) {
                                this.position.y = -this.dimension.height;
                            }
                            if (this.position.x > this.canvasSize.width) {
                                this.position.x = -this.dimension.width;
                            } else if (this.position.x + this.dimension.width < 0){
                                this.position.x = this.canvasSize.width;
                            }

                            this.kineticable.update(deltaT);
                            // Check Collision Here

                            SAT.collideGroup(this, group1, collisionType);
                            SAT.collideGroup(this, group2, collisionType);
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