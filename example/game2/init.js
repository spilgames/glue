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
                        dog: 'dog-sit.gif',
                        hills: 'hills.gif',
                        moon: 'moon.png',
                        stones: 'stones.gif',
                        tree: 'tree.png',
                        standDown: 'stand-down.gif',
                        standDownLeft: 'stand-down-left.gif',
                        standDownRight: 'stand-down-right.gif',
                        walkLeft: 'walk-left-dark.gif',
                        walkRight: 'walk-right-dark.gif'
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
                clouds = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 130,
                                y: 30
                            },
                            image: Loader.getAsset('clouds')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
                    }
                }),
                dog = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 350,
                                y: 400
                            },
                            image: Loader.getAsset('dog')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
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
                player = Component(Visible).add({
                    init: function () {
                        this.visible.setup({
                            position: {
                                x: 150,
                                y: 300
                            },
                            image: Loader.getAsset('standDownRight')
                        });
                    },
                    draw: function (deltaT, context) {
                        this.visible.draw(deltaT, context);
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
