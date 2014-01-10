/*
 *  @module Visible
 *  @namespace component
 *  @desc Represents a visible component
 *  @copyright (C) SpilGames
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
                draw: function (deltaT, context, scroll) {
                    scroll = scroll || Vector(0, 0);
                    context.save();
                    context.translate(
                        position.x - scroll.x,
                        position.y - scroll.y
                    );
                    if (Sugar.isDefined(object.rotatable)) {
                        object.rotatable.draw(deltaT, context);
                    }
                    if (Sugar.isDefined(object.scalable)) {
                        object.scalable.draw(deltaT, context);
                    }    
                    context.translate(-origin.x, -origin.y);
                    context.drawImage(
                        image,
                        0,
                        0
                    );
                    context.restore();
                },
                getPosition: function () {
                    return position;
                },
                setPosition: function (value) {
                    if (Sugar.isVector(value)) {
                        position.x = value.x;
                        position.y = value.y;
                        updateRectangle();
                    }
                },
                getDimension: function () {
                    return dimension;
                },
                setDimension: function (value) {
                    if (Sugar.isVector(value)) {
                        dimension.x = value.x;
                        dimension.y = value.y;
                    }
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
                },
                setOrigin: function (value) {
                    if (Sugar.isVector(value)) {
                        origin.x = Sugar.isNumber(value.x) ? value.x : origin.x;
                        origin.y = Sugar.isNumber(value.y) ? value.y : origin.y;
                    }
                },
                getOrigin: function () {
                    return origin;
                }
            };

            return object;
        };
    }
);
