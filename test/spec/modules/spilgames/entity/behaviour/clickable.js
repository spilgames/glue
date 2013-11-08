/**
 *  @desc Tests for clickable behaviour
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    [
        'glue',
        'modules/spilgames/entity/base',
        'modules/spilgames/entity/behaviour/clickable'
    ],
    function (Glue, Base, Clickable) {
        describe('spilgames.entity.behaviour.clickable', function () {
            'use strict';

            it('Should be able to create a clickable entity', function (done) {
                var clicked = false;

                var obj = Base(100, 100, {
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
                    clicked: function () {
                        clicked = true;
                    }
                });

                Clickable(obj);
                Glue.game.add(obj, 1);
                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                    gameX: 101,
                    gameY: 101
                }]);
                setTimeout(function () {
                    expect(clicked).toEqual(true);
                    done();
                }, 30);
            });
        });
    }
);
