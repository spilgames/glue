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
        'glue/component/rotatable'
    ],
    function (Glue, Vector, Dimension, Rectangle) {
        return function (object) {
            var Sugar = Glue.sugar,
                image = null;

            object = object || {};
            object.spritable = {
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
                draw: function (deltaT, context, scroll) {
                    context.drawImage(
                        image,
                        0,
                        0
                    );
                },
                setImage: function (value) {
                    image = value;
                    object.setDimension(Dimension(image.naturalWidth, image.naturalHeight));
                },
                getImage: function () {
                    return image;
                }
            };

            // Register methods to base object
            object.register('draw', object.spritable.draw, 'spritable');

            return object;
        };
    }
);
