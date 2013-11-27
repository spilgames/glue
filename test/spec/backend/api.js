/**
 *  @desc Tests for the backend API
 *  @copyright © 2013 - The SpilGames Authors
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
                    Glue.api.loadAPI(function(api) {
                        var logoData = Glue.api.Branding.getLogo();
                        expect(logoData).toEqual(jasmine.any(Object));
                        expect(logoData.image).toEqual(jasmine.any(String));
                        expect(logoData.link).toEqual(jasmine.any(String));
                        expect(logoData.posX).toEqual(jasmine.any(Number));
                        expect(logoData.posY).toEqual(jasmine.any(Number));
                        expect(logoData.scale).toEqual(jasmine.any(Number));
                        done();
                    });
                });
            });
        });
    }
);
