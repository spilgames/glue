/**
 *  @desc Tests for clickable behaviour
 *  @copyright (C) 2013 Jeroen Reurings, SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue',
        'glue/component/base',
        'glue/component/clickable'
    ],
    function (Glue, Base, Clickable) {
        describe('spilgames.entity.behaviour.clickable', function () {
            'use strict';

            it('Should be able to create a clickable entity', function (done) {
                var clickDown = false,
                    obj = Base(100, 100, {
                        name: 'clickableEntity',
                        height: 105,
                        spritewidth: 102,
                        image: 'rightButton'
                    }).inject({
                        draw: function (context) {
                            this.parent(context);
                        },
                        update: function () {
                            return true;
                        },
                        clickDown: function (e) {
                            clickDown = true;
                        }
                    });

                Clickable(obj);
                Glue.game.add(obj, 1);
                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                    gameX: 101,
                    gameY: 101
                }]);
                setTimeout(function () {
                    expect(clickDown).toEqual(true);
                    done();
                }, 30);
            });
        });
    }
);
