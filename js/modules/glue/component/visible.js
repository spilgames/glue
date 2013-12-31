/*
 *  @module Visible
 *  @namespace component
 *  @desc Represents a visible component
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 *
 *  Only when performance issues: Remove the need for getters and setters in visible
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
        return function (obj) {
            var Sugar = Glue.sugar,
                position = Vector(0, 0),
                dimension = null,
                image = null,
                rectangle,
                updateRectangle = function () {
                    rectangle.x1 = position.x;
                    rectangle.y1 = position.y;
                    rectangle.x2 = position.x + dimension.width;
                    rectangle.y2 = position.y + dimension.height;
                };

            obj = obj || {};
            obj.visible = {
                setup: function (settings) {
                    if (settings) {
                        if (settings.image) {
                            image = settings.image;
                        }
                        image = settings.image;
                        if (settings.position) {
                            customPosition = settings.position;
                            // using proper rounding:
                            // http://jsperf.com/math-round-vs-hack/66
                            position = Vector(
                                Math.round(customPosition.x),
                                Math.round(customPosition.y)
                            );
                        }
                        if (settings.dimension) {
                            dimension = settings.dimension;
                        } else if (image) {
                            dimension = {
                                width: image.naturalWidth,
                                height: image.naturalHeight
                            };
                            rectangle = Rectangle(
                                position.x,
                                position.y,
                                position.x + dimension.width,
                                position.y + dimension.height
                            );
                        }
                    }
                },
                draw: function (deltaT, context) {
                    context.save();
                    
                    if (Sugar.isDefined(obj.rotatable)) {
                        obj.rotatable.draw(deltaT, context);
                    }

                    if (Sugar.isDefined(obj.scalable)) {
                        obj.scalable.draw(deltaT, context);
                    }
                    context.drawImage(image, position.x, position.y)
                    context.restore();
                },
                getPosition: function () {
                    return position;
                },
                setPosition: function (value) {
                    position = value;
                    updateRectangle();
                },
                getDimension: function () {
                    return dimension;
                },
                setDimension: function (value) {
                    dimension = value;
                    updateRectangle();
                },
                getBoundingBox: function () {
                    return rectangle;
                },
                setBoundingBox: function (value) {
                    rectangle = value;
                },
                setImage: function (value) {
                    image = value;
                    dimension = {
                        width: image.naturalWidth,
                        height: image.naturalHeight
                    };
                    updateRectangle();
                },
                getImage: function () {
                    return image;
                }
            };
            return obj;
        };
    }
);
