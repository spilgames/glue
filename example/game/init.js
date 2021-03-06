glue.module.get(
    [
        'glue/game',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/baseobject',
        'glue/component/spritable',
        'glue/component/animatable',
        'glue/component/clickable',
        'glue/component/movable',
        'glue/loader'
    ],
    function (
        Game,
        Vector,
        Dimension,
        BaseObject,
        Spritable,
        Animatable,
        Clickable,
        Movable,
        Loader) {
        'use strict';

        Game.setup({
            game: {
                name: 'Jailbreaker'
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
                    bed: 'bed.png',
                    chair: 'chair.png',
                    enemy: 'enemy.png',
                    eye: 'eye.png',
                    hand: 'hand.png',
                    jailBackground: 'jail-background.png',
                    jailBars: 'jail-bars.png',
                    jailDoor: 'jail-door.png',
                    key: 'key.png',
                    player: 'player.png',
                    zzzBubble: 'zzz-bubble.png'
                }
            }
        }, function () {
            // define level components
            var jailBackground = BaseObject(Spritable).add({
                    init: function () {
                        this.spritable.setup({
                            image: Loader.getAsset('jailBackground')
                        });
                    }
                }),
                jailBars = BaseObject(Spritable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 0,
                                y: 36
                            },                            
                            image: Loader.getAsset('jailBars')
                        });
                    }
                }),
                jailDoor = BaseObject(Spritable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 772,
                                y: 132
                            },
                            image: Loader.getAsset('jailDoor')
                        });
                    }
                }),
                bed = BaseObject(Spritable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 20,
                                y: 80
                            },
                            image: Loader.getAsset('bed')
                        });
                    }
                }),
                chair = BaseObject(Spritable).add({
                    init: function () {
                        this.spritable.setup({
                            position: {
                                x: 600,
                                y: 30
                            },
                            image: Loader.getAsset('chair')
                        });
                    }
                }),
                playerSpeed = 80,
                playerDimension = null,
                left = false,
                right = false,
                up = false,
                down = false,
                radian,
                rotation,
                player = BaseObject(Animatable, Movable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 30,
                                y: 200
                            },
                            animation: {
                                frameCount: 32,
                                fps: 8,
                                animations: {
                                    standUp: {
                                        startFrame: 0,
                                        endFrame: 0
                                    },
                                    standDown: {
                                        startFrame: 8,
                                        endFrame: 8
                                    },
                                    standLeft: {
                                        startFrame: 16,
                                        endFrame: 16
                                    },
                                    standRight: {
                                        startFrame: 24,
                                        endFrame: 24
                                    },
                                    walkUp: {
                                        startFrame: 0,
                                        endFrame: 6
                                    },
                                    walkDown: {
                                        startFrame: 8,
                                        endFrame: 14
                                    },
                                    walkLeft: {
                                        startFrame: 16,
                                        endFrame: 22
                                    },
                                    walkRight: {
                                        startFrame: 24,
                                        endFrame: 30
                                    }
                                }
                            },
                            image: Loader.getAsset('player')
                        });
                        this.animatable.setAnimation('standDown');
                        playerDimension = this.animatable.getDimension();
                    },
                    update: function (gameData) {
                        var rotation;
                        this.base.update(gameData);
                        if (this.movable.atTarget()) {
                            if (down) {
                                this.animatable.setAnimation('standDown');
                            }
                            if (up) {
                                this.animatable.setAnimation('standUp');
                            }
                            if (left) {
                                this.animatable.setAnimation('standLeft');
                            }
                            if (right) {
                                this.animatable.setAnimation('standRight');
                            }
                            left = up = down = right = false;
                        } else {
                            // Set the player's walking animation based on his current rotation
                            rotation = this.movable.getRotation();
                            if (rotation > -45 && rotation < 45) {
                                if (!right) {
                                    right = true;
                                    this.animatable.setAnimation('walkRight');
                                }
                            }
                            else if (rotation > 45 && rotation < 135) {
                                if (!down) {
                                    down = true;
                                    this.animatable.setAnimation('walkDown');
                                }
                            }
                            else if (rotation < -45 && rotation > -135) {
                                if (!up) {
                                    up = true;
                                    this.animatable.setAnimation('walkUp');
                                }
                            }
                            else {
                                if (!left) {
                                    left = true;
                                    this.animatable.setAnimation('walkLeft');
                                }
                            }
                        }
                    },
                    pointerUp: function (e) {
                        this.movable.setTarget(Vector(
                            e.position.x - playerDimension.width / 2,
                            e.position.y - playerDimension.height / 2
                        ));
                        left = up = down = right = false;
                    },
                    draw: function (gameData) {
                        gameData.context.imageSmoothingEnabled = false;
                        this.base.draw(gameData);
                    }
                }),
                enemyPosition,
                enemyDimension,
                walkSpeed = 80,
                direction = 'left',
                canvasDimension = Game.canvas.getDimension(),
                enemy = BaseObject(Animatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 650,
                                y: 350
                            },
                            animation: {
                                frameCount: 33,
                                fps: 8,
                                animations: {
                                    walkUp: {
                                        startFrame: 1,
                                        endFrame: 7
                                    },
                                    walkDown: {
                                        startFrame: 9,
                                        endFrame: 15
                                    },
                                    walkLeft: {
                                        startFrame: 17,
                                        endFrame: 23
                                    },
                                    walkRight: {
                                        startFrame: 25,
                                        endFrame: 31
                                    }
                                }
                            },
                            image: Loader.getAsset('enemy')
                        });
                        this.animatable.setAnimation('walkLeft');
                        enemyDimension = this.animatable.getDimension();
                        enemyPosition = this.getPosition();
                    },
                    update: function (gameData) {
                        var deltaT = gameData.deltaT;
                        this.base.update(gameData);
                        if (enemyPosition.x > canvasDimension.width -
                                this.animatable.getFrameWidth()) {
                            this.animatable.setAnimation('walkLeft')
                            direction = 'left';
                        }
                        if (enemyPosition.x <= 0) {
                            this.animatable.setAnimation('walkRight');
                            direction = 'right';
                        }
                        switch (direction) {
                            case 'right':
                                enemyPosition.x += walkSpeed * deltaT;
                            break;
                            case 'left':
                                enemyPosition.x -= walkSpeed * deltaT;
                            break;
                        }
                    },
                    draw: function (gameData) {
                        this.base.draw(gameData);
                    }
                });

            // add level components to the game
            Game.add(jailBackground);
            Game.add(jailDoor);
            Game.add(bed);
            Game.add(chair);
            Game.add(player);
            Game.add(enemy);
            Game.add(jailBars);
        });
    }
);
