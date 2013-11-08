/**
 *  @desc Tests for the Scroll Button
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(['glue'], function (Glue) {
    describe('spilgames.entity.scrollbutton', function () {
        'use strict';
        describe('Modules', function () {
            it('Should be able to create a scrollbutton entity', function (done) {
                var updated = false,
                    drawn = false;

                glue.module.create(
                    'scrollbutton',
                    [
                        'glue',
                        'modules/spilgames/entity/behaviour/hoverable',
                        'modules/spilgames/entity/behaviour/clickable'
                    ],
                    function (Glue, Hoverable, Clickable) {
                        return function (x, y, settings) {
                                // set the initial color to white
                            var color = 'white',
                                // set the font we want to use
                                font = new me.Font('Verdana', 15, color),
                                // set the text
                                text = 'Scrollbutton',
                                // mix in some custom methods
                                obj = Glue.entity.base().extend({
                                    draw: function (context) {
                                        drawn = true;
                                        this.parent(context);
                                        font.draw(context, text, this.pos.x, this.pos.y - 30);
                                    },
                                    update: function () {
                                        updated = true;
                                        //this.parent();
                                        return true;
                                    },
                                    clicked: function () {
                                        console.log(obj.name, 'clicked');
                                    },
                                    hovered: function () {
                                        console.log(obj.name, 'hovered');
                                    }
                                });

                            // construct a new base entity instance
                            obj = new obj(x, y, settings);
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
                        // Add buttons (this will be in the screen normally)
                        me.game.add(Scrollbutton(0, 300, {
                            name: 'scrollbutton',
                            height: 105,
                            spritewidth: 102,
                            image: 'leftButton'
                        }), 1);

                        me.game.add(Scrollbutton(920, 300, {
                            name: 'scrollbutton2',
                            height: 105,
                            spritewidth: 102,
                            image: 'rightButton'
                        }), 2);

                        expect(me.game.getEntityByName('scrollbutton2')[0].name).toEqual('scrollbutton2');
                        setTimeout(function () {
                            expect(updated).toBeTruthy();
                            expect(drawn).toBeTruthy();
                            done();
                        }, 30);
                    }
                );
            });
        });
    });
});
