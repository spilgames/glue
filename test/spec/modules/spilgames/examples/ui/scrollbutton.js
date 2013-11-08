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
                                baseDraw = base.draw,
                                baseUpdate = base.update,
                                // mix in the hoverable functionality
                                hoverable = Hoverable(base),
                                // mix in the clickable functionality
                                clickable = Clickable(base),
                                // set the initial color to white
                                color = settings.color || 'white',
                                // set the font we want to use
                                font = new me.Font('Verdana', 15, 'black'),
                                // set the text
                                text = 'Scrollbutton',
                                // mix in some custom methods
                                obj = base.mix({
                                    draw: function (context) {
                                        drawn = true;
                                        baseDraw();
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
                                        baseUpdate();
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
                        // Add buttons (this will be in the screen normally)
                        me.game.add(Scrollbutton(100, 100, {
                            name: 'scrollbutton',
                            width: 100,
                            height: 100,
                            // this will be used in an actual implementation
                            image: 'leftButton',
                            // we just use the color for this test
                            color: 'red'
                        }), 1);

                        me.game.add(Scrollbutton(300, 300, {
                            name: 'scrollbutton2',
                            width: 300,
                            height: 300,
                            // this will be used in an actual implementation
                            image: 'rightButton',
                            // we just use the color for this test
                            color: 'green'
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
