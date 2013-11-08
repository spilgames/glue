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
                                // construct a new base entity instance
                            var base = new Glue.entity.base(x, y, settings),
                                // mix in the hoverable functionality
                                hoverable = Hoverable(base),
                                // mix in the clickable functionality
                                clickable = Clickable(base),
                                // set the initial color to white
                                color = 'white',
                                // set the font we want to use
                                font = new me.Font('Verdana', 15, 'black'),
                                // set the text
                                text = 'Scrollbutton',
                                // mix in some custom methods
                                obj = base.mix({
                                    draw: function (context) {
                                        drawn = true;
                                        context.fillStyle = color;
                                        context.fillRect(
                                            this.pos.x,
                                            this.pos.y,
                                            this.width,
                                            this.height
                                        );
                                        font.draw(context, text, this.pos.x, this.pos.y);
                                    },
                                    update: function () {
                                        updated = true;
                                    },
                                    clicked: function () {
                                        console.log(obj.name, 'clicked');
                                    },
                                    hovered: function () {
                                        console.log(obj.name, 'hovered');
                                    }
                                });

                            // return the mixed object
                            return obj;
                        };
                    }
                );

                glue.module.get(
                    ['scrollbutton'],
                    function (Scrollbutton) {
                        me.game.add(Scrollbutton(100, 100, {
                            name: 'scrollbutton',
                            width: 100,
                            height: 100,
                            image: 'leftButton'
                        }), 1);
                        expect(me.game.getEntityByName('scrollbutton')[0].name).toEqual('scrollbutton');
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
