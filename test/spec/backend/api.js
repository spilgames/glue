/**
 *  @desc Tests for the backend API
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    [
        'glue'
    ],
    function (Glue) {
        describe('glue.backend.api', function () {
            'use strict';

            describe('Branding', function () {
                it('Should be able to fetch image data', function (done) {
                    var updateSpy = jasmine.createSpy('update'),
                        drawSpy = jasmine.createSpy('draw');

                    expect(true).toEqual(false);
                    done();
                });
            });
        });
    }
);
