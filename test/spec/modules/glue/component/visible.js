/**
 *  @desc Tests for visible components
 *  @copyright © 2013 - SpilGames
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
                        'glue/component/base',
                        'glue/component/visible'
                    ],
                    function (obj) {
                        glue.module.create('game.player', function () {
                            var color = 'blue',
                                position = {
                                    x: 100,
                                    y: 100
                                },
                                dimension = {
                                    width: 100,
                                    height: 100
                                };

                            return function (config) {
                                return obj.mix({
                                    update: function (deltaT) {
                                        this.base.update(deltaT);
                                        updateSpy(deltaT);
                                    },
                                    draw: function (deltaT, context) {
                                        this.visible.draw(deltaT, context);
                                        drawSpy(deltaT, context);
                                        context.fillStyle = color;
                                        context.fillRect(
                                            position.x,
                                            position.y,
                                            dimension.width,
                                            dimension.height
                                        );
                                    }
                                });
                            };
                        });
                        glue.module.get(['game.player'], function (Player) {
                            var player = Player();
                            player.name = 'testVisible';
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
