/**
 *  @desc Tests for visible components
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue',
        'glue/game',
        'glue/component/visible'
    ],
    function (Glue, Game, VisibleComponent) {
        describe('glue.component.visible', function () {
            'use strict';

            it('Should be able to create a visible component',
                function (done) {
                var updateSpy = jasmine.createSpy('update'),
                    drawSpy = jasmine.createSpy('draw');

                Glue.component().create(
                    [
                        'glue/component/visible'
                    ],
                    function (obj) {
                        glue.module.create('game.player', function () {
                            var speed = 1,
                                direction = 'right';

                            return function (config) {
                                return obj.mix({
                                    update: function (deltaT) {
                                        var canvasDimension = gg.canvas.getDimensions(),
                                            playerDimension = this.visible.getDimension();

                                        this.base.update(deltaT);
                                        //console.log(this.visible.position.x,
                                        //    canvasDimension.width, playerDimension.width);
                                        if (this.visible.position.x > canvasDimension.width -
                                                playerDimension.width) {
                                            direction = 'down';
                                        }
                                        if (this.visible.position.y > canvasDimension.height -
                                                playerDimension.height) {
                                            direction = 'left';
                                        }
                                        if (this.visible.position.x < 0) {
                                            direction = 'up';
                                        }
                                        if (this.visible.position.y < 0) {
                                            this.visible.position.y = 0;
                                            direction = 'right';
                                        }
                                        switch (direction) {
                                            case 'right':
                                                this.visible.position.x += speed;
                                            break;
                                            case 'down':
                                                this.visible.position.y += speed;
                                            break;
                                            case 'left':
                                                this.visible.position.x -= speed;
                                            break;
                                            case 'up':
                                                this.visible.position.y -= speed;
                                            break;
                                        }
                                        updateSpy(deltaT);
                                    },
                                    draw: function (deltaT, context) {
                                        this.visible.draw(deltaT, context);
                                        drawSpy(deltaT, context);
                                    }
                                });
                            };
                        });
                        glue.module.get(['game.player'], function (Player) {
                            var player = Player();
                            player.name = 'testVisible';
                            player.visible.setup({
                                dimension: {
                                    width: 125,
                                    height: 92
                                },
                                image: {
                                    src: 'http://www.spilgames.com/wp-content/themes/spilgames2/images/logo.png',
                                    width: 200,
                                    height: 100,
                                    frameWidth: 100
                                }
                            });
                            gg.add(Player({}));
                            setTimeout(function () {
                                var test = gg.get('testVisible');
                                expect(test.name).toEqual('testVisible');
                                expect(updateSpy).toHaveBeenCalledWith(jasmine.any(Number));
                                expect(drawSpy).toHaveBeenCalledWith(jasmine.any(Number), jasmine.any(Object));
                                done();
                            }, 100);
                        });
                    }
                );
            });
        });
    }
);
