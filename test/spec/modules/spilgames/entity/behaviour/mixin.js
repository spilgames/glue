/**
 *  @desc Tests for the Scroll Button
 *  @author Jeroen Reurings
 *  @copyright (C) 2013 Jeroen Reurings, SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(['glue'], function (Glue) {
    describe('spilgames.entity.behaviour.mixin', function () {
        'use strict';
        describe('Modules', function () {
            it('Should be able to mixin an entity which is added updated and drawn', function (done) {
                var updated = false,
                    drawn = false,
                    floating = false,
                    clicked = false;

                glue.module.create(
                    'scrollbutton',
                    [
                        'glue',
                        'glue/modules/spilgames/entity/base',
                        'glue/modules/spilgames/entity/behaviour/hoverable',
                        'glue/modules/spilgames/entity/behaviour/clickable',
                        'glue/modules/spilgames/entity/behaviour/draggable'
                    ],
                    function (Glue, Base, Hoverable, Clickable, Draggable) {
                        return function (x, y, settings) {
                            // get the base entity and extend it
                            var obj = Base(x, y, settings).inject({
                                draw: function (context) {
                                    drawn = true;
                                    this.parent(context);
                                },
                                update: function () {
                                    floating = this.floating;
                                    updated = true;
                                    return true;
                                },
                                destruct: function () {
                                    this.destructDraggable();
                                    this.destructHoverable();
                                    this.destructClickable();
                                },
                                clickDown: function () {
                                    clicked = true;
                                }
                            });
                            // set the floating to true
                            obj.floating = true;

                            // mix in the hoverable functionality
                            Hoverable(obj);
                            // mix in the clickable functionality
                            Clickable(obj);
                            // mix in the draggable functionality
                            Draggable(obj);
                            // return the mixed object
                            return obj;
                        };
                    }
                );

                glue.module.get(
                    ['scrollbutton'],
                    function (Scrollbutton) {
                        var scrollbutton = Scrollbutton(0, 300, {
                            name: 'scrollbutton',
                            height: 105,
                            spritewidth: 102,
                            image: 'leftButton'
                        });
                        Glue.game.add(scrollbutton, 1);

                        expect(me.game.getEntityByName('scrollbutton')[0].name).toEqual('scrollbutton');
                        setTimeout(function () {
                            expect(updated).toBeTruthy();
                            expect(drawn).toBeTruthy();
                            expect(floating).toBeTruthy();
                            Glue.event.fire(Glue.input.POINTER_DOWN, [{
                                gameX: 0,
                                gameY: 301
                            }]);
                            expect(clicked).toBeTruthy();
                            clicked = false;
                            Glue.game.remove(scrollbutton);
                            setTimeout(function () {
                                Glue.event.fire(Glue.input.POINTER_DOWN, [{
                                    gameX: 0,
                                    gameY: 301
                                }]);
                                expect(clicked).toBeFalsy();
                                done();
                            }, 0);
                            
                        }, 200);
                    }
                );
            });
        });
    });
});
