/**
 *  @desc Example spec file
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue',
        'glue/game',
    ],
    function (Glue, Game, Event, VisibleComponent) {
        describe('glue.modules.example', function () {
            'use strict';

            it('Should be able to get a current Glue instance', function (done) {
                expect(Glue).toEqual(jasmine.any(Object));
                done();
            });

            it('Should be able to get a current Glue Game instance', function (done) {
                expect(Game).toEqual(jasmine.any(Object));
                done();
            });
        });
    }
);
