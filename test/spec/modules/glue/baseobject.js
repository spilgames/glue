/**
 *  @desc Baseobject
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue/game',
        'glue/baseobject',
        'glue/math/dimension'
    ],
    function (Game, BaseObject, Dimension) {
        describe('modules.glue.baseobject', function () {
            'use strict';

            it('setup', function (done) {
                Game.setup({
                    game: {
                        name: 'Spritable Spec'
                    },
                    canvas: {
                        id: 'canvas',
                        dimension: Dimension(800, 600)
                    },
                    develop: {
                        debug: true
                    },
                    asset: {
                        path: '../example/',
                        image: {
                            glue: 'glue-logo.png',
                            spil: 'spil-logo.png',
                            dog: 'dog-sit.png'
                        }
                    }
                }, function () {
                    done();
                });
            });

            var object;

            it('Should be able to create a valid base object', function (done) {
                object = BaseObject().add({
                    init: function () {},
                    update: function () {},
                    draw: function () {}
                });
                spyOn(object, 'init');
                spyOn(object, 'update');
                spyOn(object, 'draw');

                Game.add(object);

                setTimeout(function () {
                    expect(object.init).toHaveBeenCalled();
                    expect(object.update).toHaveBeenCalled();
                    expect(object.draw).toHaveBeenCalled();
                    done();
                }, 300);
            });

            afterAll(function () {
                console.log('after')
                Game.remove(object);
                Game.shutdown();
            });
        });
    }
);