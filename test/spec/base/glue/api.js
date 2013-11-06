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
                it('Should be able to create an entity', function () {
                    glue.module.create('entity/player', function () {
                        
                    });
                });
                it('Should be able to add an entity to the game', function () {
                    expect(0).toBe(1); 
                });
            });
        });
    });
}(glue));
