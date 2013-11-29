/**
 *  @desc Tests for clickable behaviour
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue',
        'glue/component/base',
        'glue/component/hoverable'
    ],
    function (Glue, Base, Hoverable) {
        describe('spilgames.entity.behaviour.hoverable', function () {
            'use strict';

            it('Should be able to create a hoverable entity', function () {
                var obj = Base(100, 100, {
                        name: 'hoverableEntity',
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
                        hoverOver: function () {

                        },
                        hoverOut: function () {

                        }
                    });

                spyOn(obj, 'hoverOver');
                spyOn(obj, 'hoverOut');

                Hoverable(obj);
                Glue.game.add(obj, 1);
                
                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                    gameX: 150,
                    gameY: 150
                }]);
                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                    gameX: 10,
                    gameY: 10
                }]);
                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                    gameX: 120,
                    gameY: 120
                }]);
                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                    gameX: 800,
                    gameY: 300
                }]);

                expect(obj.hoverOver.calls.length).toEqual(2);
                expect(obj.hoverOut.calls.length).toEqual(2);
            });
        });
    }
);
