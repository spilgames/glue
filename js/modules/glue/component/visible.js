/*
 *  @module Visible
 *  @namespace component
 *  @desc Represents a visible component
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/visible',
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
                position = Vector(0, 0),
                origin = Vector(0, 0),
                dimension = Dimension(0, 0),
                image = null,
                rectangle = Rectangle(0, 0, 0, 0),
                updateRectangle = function () {
                    var scale = Vector(1, 1);
                    if (object.scalable) {
                        scale = object.scalable.getScale();
                    }
                    rectangle.x1 = position.x - origin.x * Math.abs(scale.x);
                    rectangle.y1 = position.y - origin.y * Math.abs(scale.y);
                    rectangle.x2 = position.x - origin.x * Math.abs(scale.x) + dimension.width;
                    rectangle.y2 = position.y - origin.y * Math.abs(scale.y) + dimension.height;
                };

            object = object || {};
            object.visible = {
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
                        if (Sugar.isDefined(dimension)) {
                            object.setBoundingBox(Rectangle(
                                position.x,
                                position.y,
                                position.x + dimension.width,
                                position.y + dimension.height
                            ));
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
            object.register('draw', object.visible.draw, 'visible');

            return object;
        };
    }
);
