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
                it('Should be able to create an entity which gets updated and drawn in the game loop', function () {
                    var updated = false,
                        drawn = false;

                    glue.module.create('entity/player', function () {
                        return function () {
                            return me.ObjectEntity.extend({
                                init: function (x, y, settings) {
                                    this.parent(x, y, settings);
                                    this.name = settings.name;
                                    this.width = settings.width;
                                    this.height = settings.height;
                                    this.color = settings.color;
                                },
                                update: function () {
                                    updated = true;
                                    return true;
                                },
                                draw: function (context) {
                                    drawn = true;
                                    context.fillStyle = 'blue';
                                    context.fillRect(this.pos.x, this.pos.y, this.width, this.height);
                                }
                            });
                        };
                    });
                    glue.module.get(['entity/player'], function (Entity) {
                        var testEntity = Entity();
                        me.game.add(new testEntity(0, 0, {
                            name: 'testPlayer',
                            width: 100,
                            height: 100,
                            color: 'blue'
                        }), 2);
                        expect(me.game.getEntityByName('testPlayer')[0].name).toEqual('testPlayer');
                        setTimeout(function () {
                            expect(updated).toBeTruthy();
                            expect(drawn).toBeTruthy();
                        }, 30);
                    });
                });
            });
        });
    });
}(glue));
