/**
 *  @desc Tests for the Glue Api
 *  @copyright (C) 2013 Jeroen Reurings, SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
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
                            'glue/component/base'
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
            describe('Events', function () {
                it('Should be able to subscribe to and fire an event', function (done) {
                    glue.module.create(
                        'subscribe',
                        [
                            'glue'
                        ],
                        function (Glue) {
                            return function () {
                                var result = 'none';
                                var callback = function (value) {
                                        result = value;
                                    };

                                Glue.event.on('test.event', callback);
                                return {
                                    get: function () {
                                        return result;
                                    }
                                };
                            };
                        }
                    );
                    glue.module.create(
                        'fire',
                        [
                            'glue'
                        ],
                        function (Glue) {
                            return function () {
                                return {
                                    fire: function () {
                                        Glue.event.fire('test.event', ['test']);
                                    }
                                };
                            };
                        }
                    );
                    glue.module.get(['subscribe', 'fire'], function (Subscribe, Fire) {
                        var subscribe = Subscribe(),
                            fire = Fire();

                        fire.fire();
                        expect(subscribe.get()).toEqual('test');
                        done();
                    });
                });
                it('Should be able to unsubscribe from an event', function (done) {
                    glue.module.create(
                        'subscribe2',
                        [
                            'glue'
                        ],
                        function (Glue) {
                            return function () {
                                var result = 'none';
                                var callback = function (value) {
                                        result = value;
                                    };

                                Glue.event.on('test.event2', callback);
                                Glue.event.off('test.event2', callback);
                                return {
                                    get: function () {
                                        return result;
                                    }
                                };
                            };
                        }
                    );
                    glue.module.create(
                        'fire2',
                        [
                            'glue'
                        ],
                        function (Glue) {
                            return function () {
                                return {
                                    fire: function () {
                                        Glue.event.fire('test.event2', ['test']);
                                    }
                                };
                            };
                        }
                    );
                    glue.module.get(['subscribe2', 'fire2'], function (Subscribe, Fire) {
                        var subscribe = Subscribe(),
                            fire = Fire();

                        fire.fire();
                        expect(subscribe.get()).toEqual('none');
                        done();
                    });
                });
                it('Should be able to unsubscribe from an event using this scope binding', function (done) {
                    glue.module.create(
                        'subscribe3',
                        [
                            'glue'
                        ],
                        function (Glue) {
                            return function () {
                                var result = 'none';
                                var callback = function (value) {
                                        result = this;
                                    };

                                callback = callback.bind({test:true});
                                Glue.event.on('test.event3', callback);
                                Glue.event.off('test.event3', callback);
                                return {
                                    get: function () {
                                        return result;
                                    }
                                };
                            };
                        }
                    );
                    glue.module.create(
                        'fire3',
                        [
                            'glue'
                        ],
                        function (Glue) {
                            return function () {
                                return {
                                    fire: function () {
                                        Glue.event.fire('test.event3', ['test3']);
                                    }
                                };
                            };
                        }
                    );
                    glue.module.get(['subscribe3', 'fire3'], function (Subscribe, Fire) {
                        var subscribe = Subscribe(),
                            fire = Fire();

                        fire.fire();
                        expect(subscribe.get()).toEqual('none');
                        done();
                    });
                });
            });
        });
    });
});
