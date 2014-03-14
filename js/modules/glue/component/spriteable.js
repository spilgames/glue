/*
 *  @module Spritable
 *  @namespace component
 *  @desc Represents a spritable component consisting of a simple image
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/spritable',
    [
        'glue',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/math/rectangle',
        'glue/basecomponent'
    ],
    function (Glue, Vector, Dimension, Rectangle, BaseComponent) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('spritable', object),
                image = null;

            baseComponent.set({
                setup: function (settings) {
                    var customPosition;
                    if (settings) {
                        if (settings.image) {
                            image = settings.image;
                        }
                        image = settings.image;
                        if (settings.position) {
                            customPosition = settings.position;
                            // using proper rounding:
                            // http://jsperf.com/math-round-vs-hack/66
                            object.setPosition(Vector(
                                Math.round(customPosition.x),
                                Math.round(customPosition.y)
                            ));
                        }
                        if (settings.dimension) {
                            object.setDimension(settings.dimension);
                        } else if (image) {
                            object.setDimension(Dimension(image.naturalWidth, image.naturalHeight));
                        }
                        if (settings.origin) {
                            object.setOrigin(settings.origin);
                        }
                    }
                },
                draw: function (gameData) {
                    if (!object.animatable) {
                        gameData.context.drawImage(
                            image,
                            0,
                            0
                        );
                    }
                },
                setImage: function (value) {
                    image = value;
                    object.setDimension(Dimension(image.naturalWidth, image.naturalHeight));
                },
                getImage: function () {
                    return image;
                },
                register: function () {
                    baseComponent.register('draw');
                },
                unregister: function () {
                    baseComponent.unregister('draw');
                }
            });

            return object;
        };
    }
);
