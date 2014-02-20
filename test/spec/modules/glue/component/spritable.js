/**
 *  @desc Spritable specs
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create([
    'glue/game',
    'glue/math/vector',
    'glue/math/dimension',
    'glue/math/rectangle',
    'glue/loader',
    'glue/baseobject',
    'glue/component/spritable'
],
function (Game, Vector, Dimension, Rectangle, Loader, BaseObject, Spritable) {
    describe('modules.glue.component.spritable', function () {
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
                        spil: 'spil-logo.png'
                    }
                }
            }, function () {
                done();
            });
        });

        var object;

        it('Should be able to create a valid spritable component', function (done) {
            object = BaseObject(Spritable).add({
                    init: function () {
                        this.spritable.setup({
                            position: Vector(100, 100),
                            dimension: Dimension(200, 200),
                            image: Loader.getAsset('glue'),
                            origin: Vector(200, 200)
                        });
                    },
                    draw: function (deltaT, context) {
                        this.base.draw(deltaT, context);
                    }
                });

            spyOn(object, 'init').andCallThrough();
            spyOn(object, 'draw').andCallThrough();

            Game.add(object);

            setTimeout(function () {
                // Check if the base object gets called by the Game in the proper way
                expect(object.init).toHaveBeenCalled();
                expect(object.draw).toHaveBeenCalledWith(
                    jasmine.any(Number),
                    jasmine.any(Object),
                    jasmine.any(Object)
                );
                done();
            }, 300);
        });

        it('Should be able to retrieve values which are set in the setup method', function () {
            expect(object.getPosition().get()).toEqual(Vector(100, 100).get());
            expect(object.getDimension().get()).toEqual(Dimension(200, 200).get());
            expect(object.getOrigin().get()).toEqual(Vector(200, 200).get());
            expect(object.getBoundingBox().get()).toEqual(Rectangle(100, 100, 300, 300).get());
            expect(object.spritable.getImage()).toEqual(Loader.getAsset('glue'));
        });

        it('Should be able to set values by using setter methods', function () {
            object.setPosition(Vector(200, 200));
            object.setDimension(Dimension(400, 400));
            object.setOrigin(Vector(300, 300));
            object.setBoundingBox(Rectangle(10, 10, 100, 100));
        });

        it('Should be able to retrieve proper values which are set using setter methods', function () {
            expect(object.getPosition().get()).toEqual(Vector(200, 200).get());
            expect(object.getDimension().get()).toEqual(Dimension(400, 400).get());
            expect(object.getOrigin().get()).toEqual(Vector(300, 300).get());
            expect(object.getBoundingBox().get()).toEqual(Rectangle(10, 10, 100, 100).get());
        });

        it('Should update dimension and rectange when the image is updated', function () {
            object.setOrigin(Vector(0, 0));
            object.spritable.setImage(Loader.getAsset('spil'));
            expect(object.spritable.getImage()).toEqual(Loader.getAsset('spil'));
            expect(object.getDimension().get()).toEqual(Dimension(125, 92).get());
            expect(object.getBoundingBox().get()).toEqual(Rectangle(200, 200, 325, 292).get());
        });

        afterAll(function () {
            Game.remove(object);
            Game.shutdown();
        });
    });
});