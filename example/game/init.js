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
                                y: 96
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
                player = Component(Animatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 30,
                                y: 200
                            },
                            frameCount: 32,
                            fps: 8,
                            image: Loader.getAsset('player')
                        });
                    },
                    update: function (deltaT) {
                        this.animatable.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        this.animatable.draw(deltaT, context);
                    }
                }),
                enemy = Component(Animatable).add({
                    init: function () {
                        this.animatable.setup({
                            position: {
                                x: 650,
                                y: 350
                            },
                            frameCount: 33,
                            fps: 8,
                            image: Loader.getAsset('enemy')
                        });
                    },
                    update: function (deltaT) {
                        this.animatable.update(deltaT);
                    },
                    draw: function (deltaT, context) {
                        this.animatable.draw(deltaT, context);
                    }
                });


            // add level components to the game
            Game.add(jailBackground);
            Game.add(jailBars);
            Game.add(jailDoor);
            Game.add(bed);
            Game.add(chair);
            Game.add(player);
            Game.add(enemy);
        });
    }
);
