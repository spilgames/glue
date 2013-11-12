/**
 *  @desc Tests for the Glue Api
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(['glue'], function (Glue) {
    describe('glue.api', function () {
        'use strict';
        describe('Api', function () {
            describe('Modules', function () {
                it('Should be able to create and import a created module', function (done) {
                    glue.module.create('glue/module1', function () {
                        return function () {
                            var name = 'module1';
                            return {
                                getName: function () {
                                    return name;
                                }
                            };
                        };
                    });
                    glue.module.get(['glue/module1'], function (Module1) {
                        expect(Module1().getName()).toEqual('module1');
                        done();
                    });
                });
            });
            describe('Entities', function () {
                it('Should be able to create an entity which gets updated and drawn in the game loop', function (done) {
                    var updated = false,
                        drawn = false;

                    glue.module.create(
                        'entity/player',
                        [
                            'glue',
                            'modules/spilgames/entity/behaviour/base'
                        ],
                        function (Glue, Base) {
                            return function (x, y, settings) {
                                var color = 'white',
                                    // set the font we want to use
                                    font = new me.Font('Verdana', 15, 'black'),
                                    // set the text
                                    text = 'Player entity',
                                    // mix in some custom methods
                                    obj = Base(x, y, settings).inject({
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
                                            return true;
                                        }
                                    });
                                // return the mixed object
                                return obj;
                            };
                        }
                    );
                    glue.module.get(
                        ['entity/player'],
                        function (Entity) {
                            me.game.add(Entity(100, 100, {
                                name: 'testplayer',
                                width: 100,
                                height: 100
                            }), 1);
                            expect(me.game.getEntityByName('testplayer')[0].name).toEqual('testplayer');
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
});
