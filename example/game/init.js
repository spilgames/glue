glue.module.get(
    [
        'glue/domready',
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
        DomReady,
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

        DomReady(function () {
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
                    image: {
                        path: 'asset/',
                        source: {
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
                }
            }, function () {
                // define level components
                var jailBackground = Component(Visible).add({
                        init: function () {
                            this.visible.setup({
                                image: Loader.getAsset('jailBackground')
                            });
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    }),
                    jailBars = Component(Visible).add({
                        init: function () {
                            this.visible.setup({
                                position: {
                                    x: 0,
                                    y: 36
                                },                            
                                image: Loader.getAsset('jailBars')
                            });
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    }),
                    jailDoor = Component(Visible).add({
                        init: function () {
                            this.visible.setup({
                                position: {
                                    x: 772,
                                    y: 132
                                },
                                image: Loader.getAsset('jailDoor')
                            });
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    }),
                    bed = Component(Visible).add({
                        init: function () {
                            this.visible.setup({
                                position: {
                                    x: 20,
                                    y: 80
                                },
                                image: Loader.getAsset('bed')
                            });
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    }),
                    chair = Component(Visible).add({
                        init: function () {
                            this.visible.setup({
                                position: {
                                    x: 600,
                                    y: 30
                                },
                                image: Loader.getAsset('chair')
                            });
                        },
                        draw: function (deltaT, context) {
                            this.visible.draw(deltaT, context);
                        }
                    }),
                    playerSpeed = 80,
                    playerTarget = null,
                    playerPosition = null,
                    playerDimension = null,
                    left = false,
                    right = false,
                    up = false,
                    down = false,
                    radian,
                    rotation,
                    player = Component(Animatable).add({
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
                                            endFrame: 1
                                        },
                                        standDown: {
                                            startFrame: 8,
                                            endFrame: 9
                                        },
                                        standLeft: {
                                            startFrame: 16,
                                            endFrame: 17
                                        },
                                        standRight: {
                                            startFrame: 24,
                                            endFrame: 25
                                        },
                                        walkUp: {
                                            startFrame: 0,
                                            endFrame: 7
                                        },
                                        walkDown: {
                                            startFrame: 8,
                                            endFrame: 15
                                        },
                                        walkLeft: {
                                            startFrame: 16,
                                            endFrame: 23
                                        },
                                        walkRight: {
                                            startFrame: 24,
                                            endFrame: 31
                                        }
                                    }
                                },
                                image: Loader.getAsset('player')
                            });
                            this.animatable.setAnimation('standDown');
                            playerDimension = this.animatable.getDimension();
                        },
                        update: function (deltaT) {
                            this.animatable.update(deltaT);
                            playerPosition = this.animatable.getPosition();
                            if (playerTarget !== null) {
                                var deltaX = playerTarget.x - playerPosition.x,
                                    deltaY = playerTarget.y - playerPosition.y;

                                // Pythagorean theorem : c = √( a2 + b2 )
                                // We stop moving the player if the remaining distance to the endpoint
                                // is smaller then the step iterator (playerSpeed * deltaT).
                                if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < playerSpeed * deltaT) {
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
                                }
                                else
                                {
                                    // Update the player's x and y position, using cos for x and sin for y
                                    // and get the right speed by multiplying by the speed and delta time.
                                    radian = Math.atan2(deltaY, deltaX);
                                    playerPosition.x += Math.cos(radian) * playerSpeed * deltaT;
                                    playerPosition.y += Math.sin(radian) * playerSpeed * deltaT;
                                    rotation = radian * 180 / Math.PI;

                                    // Set the player's walking animation based on his current rotation
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
                            }
                        },
                        pointerUp: function (e) {
                            playerTarget = Vector(
                                e.position.x - playerDimension.width / 2,
                                e.position.y - playerDimension.height / 2
                            );
                            left = up = down = right = false;
                        },
                        draw: function (deltaT, context) {
                            context.imageSmoothingEnabled = false;
                            this.animatable.draw(deltaT, context);
                        }
                    }),
                    enemyPosition,
                    enemyDimension,
                    walkSpeed = 1,
                    direction = 'left',
                    canvasDimension = Game.canvas.getDimension(),
                    enemy = Component(Animatable).add({
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
                                            startFrame: 0,
                                            endFrame: 7
                                        },
                                        walkDown: {
                                            startFrame: 8,
                                            endFrame: 15
                                        },
                                        walkLeft: {
                                            startFrame: 16,
                                            endFrame: 23
                                        },
                                        walkRight: {
                                            startFrame: 24,
                                            endFrame: 31
                                        }
                                    }
                                },
                                image: Loader.getAsset('enemy')
                            });
                            this.animatable.setAnimation('walkLeft');
                        },
                        update: function (deltaT) {
                            this.animatable.update(deltaT);
                            enemyDimension = this.animatable.getDimension();
                            enemyPosition = this.animatable.getPosition();
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
                                    enemyPosition.x += walkSpeed;
                                break;
                                case 'left':
                                    enemyPosition.x -= walkSpeed;
                                break;
                            }
                        },
                        draw: function (deltaT, context) {
                            this.animatable.draw(deltaT, context);
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
        });
    }
);
