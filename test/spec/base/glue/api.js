/**
 *  @desc Tests for the Glue Api
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
(function (Glue) {
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
                it('Should be able to create an entity which gets updated in the game loop', function (done) {
                    glue.module.create('entity/player', function () {
                        return function () {
                            return me.ObjectEntity.extend({
                                init: function (x, y, settings) {
                                    this.parent(x, y, settings);
                                    this.name = settings.name;
                                },
                                update: function () {

                                }
                            });
                        };
                    });
                    glue.module.get(['entity/player'], function (Entity) {
                        var testEntity = Entity();
                        me.game.add(new testEntity(0, 0, {
                            name: 'testPlayer',
                            width: 10,
                            height: 10
                        }), 1);
                        expect(me.game.getEntityByName('testPlayer')[0].name).toEqual('testPlayer');
                        expect(1).toBe(0);
                        done();
                    });
                });
                it('Should be able to add an entity to the game', function () {
                    expect(0).toBe(1);
                });

                it('Should be able to spy on an event callback function', function (done) {
                    glue.module.create('entity/player', function () {
                        return function () {
                            return me.ObjectEntity.extend({
                                init: function (x, y, settings) {
                                    this.parent(x, y, settings);
                                    glue.event.on(glue.input.POINTER_MOVE, this.moveCallback);
                                },
                                update: function () {

                                },
                                moveCallback: function () {
                                    console.log('called');
                                }
                            });
                        };
                    });
                    glue.module.get(['entity/player'], function (Entity) {
                        var testEntity = Entity();
                        console.log(testEntity)
                        var entity = new testEntity(0, 0, {
                            name: 'testPlayer',
                            width: 10,
                            height: 10
                        });
                        console.log(entity);
                        glue.event.fire(glue.input.POINTER_MOVE);
                        spyOn(entity, 'moveCallback');
                        expect(entity.moveCallback).toHaveBeenCalled();
                        done();
                    });
                });
            });
        });
    });
}(glue));
