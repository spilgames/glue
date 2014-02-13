glue.module.get(
    [
        'glue/game',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/baseobject',
        'glue/component/visible',
        'glue/component/animatable',
        'glue/component/draggable',
        'glue/component/droptarget',
        'glue/component/hoverable',
        'glue/component/clickable',
        'glue/loader'
    ],
    function (
        Game,
        Vector,
        Dimension,
        BaseObject,
        Visible,
        Animatable,
        Draggable,
        Droptarget,
        Hoverable,
        Clickable,
        Loader) {
        'use strict';

        Game.setup({
            game: {
                name: 'Inspector Dan'
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
                    background: 'background.jpg',
                    clouds: 'clouds.png',
                    dog: 'dog-sit.png',
                    hills: 'hills.gif',
                    moon: 'moon.png',
                    stones: 'stones.gif',
                    tree: 'tree.png',
                    standDown: 'stand-down.gif',
                    standDownLeft: 'stand-down-left.gif',
                    standDownRight: 'stand-down-right.gif',
                    walk: 'walk.png'
                }
            }
        }, function () {
            // define level components
            var background = BaseObject(Visible).add({
                    init: function () {
                        this.visible.setup({
                            image: Loader.getAsset('background')
                        });
                    }
                }),
                canvasDimension = Game.canvas.getDimension(),
                cloudsPosition,
                cloudsDimension,
                moveSpeed = 20,
                clouds = BaseObject(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: -332,
                                y: 30
                            },
                            image: Loader.getAsset('clouds')
                        });
                    },
                    update: function (deltaT, context) {
                        cloudsDimension = this.getDimension();
                        cloudsPosition = this.getPosition();
                        if (cloudsPosition.x > canvasDimension.width - cloudsDimension.width) {
                            cloudsPosition.x = -cloudsDimension.width;
                        }
                        cloudsPosition.x += moveSpeed * deltaT;
                    }
                }),
                dog = BaseObject(Visible, Animatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 350,
                                y: 400
                            },
                            image: Loader.getAsset('dog'),
                            animation: {
                                frameCount: 8,
                                fps: 8,
                                animations: {
                                    wiggleTail: {
                                        startFrame: 1,
                                        endFrame: 8
                                    }
                                }
                            }
                        });
                        this.animatable.setAnimation('wiggleTail');
                    },
                    draw: function (deltaT, context) {
                        this.animatable.draw(deltaT, context);
                    }
                }),
                hills = BaseObject(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 200
                            },
                            image: Loader.getAsset('hills')
                        });
                    }
                }),
                moon = BaseObject(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 100,
                                y: 50
                            },
                            image: Loader.getAsset('moon')
                        });
                    }
                }),
                stones = BaseObject(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 300
                            },
                            image: Loader.getAsset('stones')
                        });
                    }
                }),
                tree = BaseObject(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 510,
                                y: 0
                            },
                            image: Loader.getAsset('tree')
                        });
                    }
                }),
                // TODO: Documentation:
                // target at developers explaining module pattern and difference with oop
                // and why composition over inheritance with real good example code
                direction = 'right',
                canvasDimension = Game.canvas.getDimension(),
                playerPosition,
                playerDimension,
                walkSpeed = 80,
                player = BaseObject(Visible, Animatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 0,
                                y: 350
                            },
                            image: Loader.getAsset('walk'),
                            animation: {
                                frameCount: 16,
                                animations: {
                                    walkLeft: {
                                        startFrame: 1,
                                        endFrame: 8,
                                        fps: 6
                                    },
                                    walkRight: {
                                        startFrame: 9,
                                        endFrame: 16,
                                        fps: 6
                                    }
                                }
                            }
                        });
                    },
                    update: function (deltaT) {
                        this.animatable.update(deltaT);
                        playerDimension = this.animatable.getDimension();
                        playerPosition = this.getPosition();
                        if (playerPosition.x > canvasDimension.width -
                                this.animatable.getFrameWidth()) {
                            this.animatable.setAnimation('walkLeft');
                            direction = 'left';
                        }
                        if (playerPosition.x <= 0) {
                            this.animatable.setAnimation('walkRight');
                            direction = 'right';
                        }
                        switch (direction) {
                            case 'right':
                                playerPosition.x += walkSpeed * deltaT;
                            break;
                            case 'left':
                                playerPosition.x -= walkSpeed * deltaT;
                            break;
                        }
                    },
                    draw: function (deltaT, context) {
                        this.animatable.draw(deltaT, context);
                    }
                });

            // add level components to the game
            Game.add(background);
            Game.add(moon);
            Game.add(clouds);
            Game.add(hills);
            Game.add(dog);
            Game.add(stones);
            Game.add(tree);
            Game.add(player);
        });
    }
);
