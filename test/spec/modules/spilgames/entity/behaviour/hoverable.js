/**
 *  @desc Tests for clickable behaviour
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    [
        'glue',
        'glue/modules/spilgames/entity/base',
        'glue/modules/spilgames/entity/behaviour/hoverable'
    ],
    function (Glue, Base, Hoverable) {
        describe('spilgames.entity.behaviour.hoverable', function () {
            'use strict';

            it('Should be able to create a hoverable entity', function (done) {
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
                Glue.event.fire(Glue.input.POINTER_MOVE, [{
                    gameX: 110,
                    gameY: 110
                }]);
                Glue.event.fire(Glue.input.POINTER_MOVE, [{
                    gameX: 10,
                    gameY: 10
                }]);
                Glue.event.fire(Glue.input.POINTER_MOVE, [{
                    gameX: 110,
                    gameY: 110
                }]);
                Glue.event.fire(Glue.input.POINTER_MOVE, [{
                    gameX: 10,
                    gameY: 10
                }]);
                setTimeout(function () {
                    expect(obj.hoverOver.calls.length).toEqual(2);
                    expect(obj.hoverOut.calls.length).toEqual(2);
                    done();
                }, 30);
            });
        });
    }
);
