glue.module.get(
    [
        'glue/game',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/component',
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
        Component,
        Visible,
        Animatable,
        Draggable,
        Droptarget,
        Hoverable,
        Clickable,
        Loader) {
        'use strict';

        Game.setup({
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
                        walkLeft: 'walk-left-dark.png',
                        walkRight: 'walk-right-dark.png'
                    }
                }
            }
        }, function () {
            // define level components
            var background = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            image: Loader.getAsset('background')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                }),
                canvasDimension = Game.canvas.getDimension(),
                cloudsPosition,
                cloudsDimension,
                moveSpeed = 0.2,
                clouds = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 30
                            },
                            image: Loader.getAsset('clouds')
                        });
                    },
                    update: function (deltaT, context) {
                        cloudsDimension = this.visible.getDimension();
                        cloudsPosition = this.visible.getPosition();
                        if (cloudsPosition.x > canvasDimension.width - cloudsDimension.width) {
                            cloudsPosition = {
                                x: 0,
                                y: 30
                            }
                        }
                        cloudsPosition.x += moveSpeed;
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                }),
                dog = Component(Animatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 350,
                                y: 400
                            },
                            image: Loader.getAsset('dog'),
                            frameCount: 8,
                            fps: 8
                        });
                    },
                    update: function (deltaT, context) {
                        this.animatable.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        this.animatable.draw(deltaT, context);
                    }
                }),
                hills = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 200
                            },
                            image: Loader.getAsset('hills')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                }),
                moon = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 340,
                                y: 50
                            },
                            image: Loader.getAsset('moon')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                }),
                stones = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 0,
                                y: 300
                            },
                            image: Loader.getAsset('stones')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                }),
                tree = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 510,
                                y: 0
                            },
                            image: Loader.getAsset('tree')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                }),
                // TODO: Documentation:
                // target at developers explaining module pattern and difference with oop
                // and why composition over inheritance with real good example code
                direction = 'right',
                canvasDimension = Game.canvas.getDimension(),
                playerPosition,
                playerDimension,
                walkSpeed = 1,
                player = Component(Animatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 0,
                                y: 350
                            },
                            image: Loader.getAsset('walkRight')
                        });
                    },
                    update: function (deltaT) {
                        this.animatable.update(deltaT);
                        playerDimension = this.animatable.getDimension();
                        playerPosition = this.animatable.getPosition();
                        if (playerPosition.x > canvasDimension.width -
                                this.animatable.getFrameWidth()) {
                            this.animatable.setup({
                                image: Loader.getAsset('walkLeft'),
                                frameCount: 8,
                                fps: 8
                            });
                            direction = 'left';
                        }
                        if (playerPosition.x <= 0) {
                            this.animatable.setup({
                                image: Loader.getAsset('walkRight'),
                                frameCount: 8,
                                fps: 8
                            });
                            direction = 'right';
                        }
                        switch (direction) {
                            case 'right':
                                playerPosition.x += walkSpeed;
                            break;
                            case 'left':
                                playerPosition.x -= walkSpeed;
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
