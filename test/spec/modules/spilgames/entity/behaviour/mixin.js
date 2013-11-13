/**
 *  @desc Tests for the Scroll Button
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(['glue'], function (Glue) {
    describe('spilgames.entity.behaviour.mixin', function () {
        'use strict';
        describe('Modules', function () {
            it('Should be able to mixin an entity which is added updated and drawn', function (done) {
                var updated = false,
                    drawn = false,
                    floating = false;

                glue.module.create(
                    'scrollbutton',
                    [
                        'glue',
                        'glue/modules/spilgames/entity/base',
                        'glue/modules/spilgames/entity/behaviour/hoverable',
                        'glue/modules/spilgames/entity/behaviour/clickable'
                    ],
                    function (Glue, Base, Hoverable, Clickable) {
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
                                clicked: function () {
                                    //console.log(obj.name, 'clicked');
                                },
                                hovered: function () {
                                    //console.log(obj.name, 'hovered');
                                }
                            });

                            // mix in the hoverable functionality
                            Hoverable(obj);
                            // mix in the clickable functionality
                            Clickable(obj);
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
                        scrollbutton.floating = true;
                        Glue.game.add(scrollbutton, 1);

                        expect(me.game.getEntityByName('scrollbutton')[0].name).toEqual('scrollbutton');
                        setTimeout(function () {
                            expect(updated).toBeTruthy();
                            expect(drawn).toBeTruthy();
                            expect(floating).toBeTruthy();
                            done();
                        }, 70);
                    }
                );
            });
        });
    });
});
