/**
 *  @desc Spritable
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
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

            var component;

            it('Should be able to create a valid spritable component', function (done) {
                component = BaseObject(Spritable).add({
                        init: function () {
                            this.spritable.setup({
                                position: Vector(100, 100),
                                dimension: Dimension(200, 200),
                                image: Loader.getAsset('glue'),
                                origin: Vector(200, 200)
                            });
                        },
                        draw: function (deltaT, context) {
                            this.spritable.draw(deltaT, context);
                        }
                    });

                spyOn(component, 'init').andCallThrough();
                spyOn(component, 'draw').andCallThrough();

                Game.add(component);

                setTimeout(function () {
                    // Check if the base object gets called by the Game in the proper way
                    expect(component.init).toHaveBeenCalled();
                    expect(component.draw).toHaveBeenCalledWith(
                        jasmine.any(Object)
                    );

                    done();
                }, 300);
            });

            it('Should be able to retrieve values which are set in the setup method', function () {
                expect(component.getPosition().get()).toEqual(Vector(100, 100).get());
                expect(component.getDimension().get()).toEqual(Dimension(200, 200).get());
                expect(component.getOrigin().get()).toEqual(Vector(200, 200).get());
                expect(component.getBoundingBox().get()).toEqual(Rectangle(-100, -100, 100, 100).get());
                expect(component.spritable.getImage()).toEqual(Loader.getAsset('glue'));
            });

            it('Should be able to set values by using setter methods', function () {
                component.setPosition(Vector(200, 200));
                component.setDimension(Dimension(400, 400));
                component.setOrigin(Vector(300, 300));
                component.setBoundingBox(Rectangle(10, 10, 100, 100));
            });

            it('Should be able to retrieve proper values which are set using setter methods', function () {
                expect(component.getPosition().get()).toEqual(Vector(200, 200).get());
                expect(component.getDimension().get()).toEqual(Dimension(400, 400).get());
                expect(component.getOrigin().get()).toEqual(Vector(300, 300).get());
                expect(component.getBoundingBox().get()).toEqual(Rectangle(10, 10, 100, 100).get());
            });

            it('Should update dimension and rectange when the image is updated', function () {
                component.setOrigin(Vector(0, 0));
                component.spritable.setImage(Loader.getAsset('spil'));
                expect(component.spritable.getImage()).toEqual(Loader.getAsset('spil'));
                expect(component.getDimension().get()).toEqual(Dimension(125, 92).get());
                expect(component.getBoundingBox().get()).toEqual(Rectangle(200, 200, 325, 292).get());
            });

        });
    }
);