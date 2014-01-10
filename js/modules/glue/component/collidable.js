/*
 *  @module Collidable
 *  @namespace component
 *  @desc Represents a collidable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/collidable',
    [
        'glue',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/math/rectangle'
    ],
    function (Glue, Vector, Dimension, Rectangle) {
        return function (object) {
            'use strict';
            var Sugar = Glue.sugar,
                boundingBox = Rectangle(0, 0, null, null),
                circle = {
                    x: 0,
                    y: 0,
                    radius: null
                },
                isStatic = false,
                collisionSide = Vector(0, 0),
                position,
                dimension = Dimension(0, 0),
                origin,
                scale = Vector(1, 1),
                max,
                updateBoundingBox = function () {
                    boundingBox.x1 = position.x - origin.x * Math.abs(scale.x);
                    boundingBox.y1 = position.y - origin.y * Math.abs(scale.y);
                    if (boundingBox.x2 === null || boundingBox.y2 === null) {
                        boundingBox.x2 = dimension.width;
                        boundingBox.y2 = dimension.height;
                    }
                    boundingBox.x2 *= scale.x;
                    boundingBox.y2 *= scale.y;
                    circle.x = boundingBox.x1 + (boundingBox.x2 / 2);
                    circle.y = boundingBox.y1 + (boundingBox.y2 / 2);
                    if (circle.radius === null) {
                        max = Math.max(boundingBox.x2, boundingBox.y2);
                        circle.radius = (Math.sqrt(
                            (-max / 2) * (-max / 2) +
                            (-max / 2) * (-max / 2)
                        ));
                    }
                },
                resolveCollision = function (vector, side) {
                    if (Sugar.isDefined(position) && Sugar.isVector(vector)) {
                        object.visible.setPosition(position.substract(vector));
                        if (Sugar.isDefined(side) && Sugar.isVector(side)) {
                            side.scale(-1);
                            collisionSide.copy(side);
                        }
                    }
                };

            object = object || {};
            object.collidable = {
                resolveCollision: resolveCollision,
                setup: function () {
                    if (Sugar.isUndefined(object.visible)) {
                        throw 'Collidable needs a visible component';
                    }
                    position = object.visible.getPosition();
                    origin = object.visible.getOrigin();

                    if (Sugar.isDefined(object.animatable)) {
                        dimension = object.animatable.getDimension();
                    } else if (Sugar.isDefined(object.visible)) {
                        dimension = object.visible.getDimension();
                    }
                    if (Sugar.isDefined(object.scalable)) {
                        scale = object.scalable.getScale();
                    }
                },
                update: function (deltaT) {
                    updateBoundingBox();
                },
                setBoundingDimension: function (dimension) {
                    boundingBox.x2 = dimension.width;
                    boundingBox.y2 = dimension.height;
                },
                setBoundingCircleRadius: function (radius) {
                    circle.radius = radius;
                },
                getBoundingBox: function () {
                    return boundingBox;
                },
                getBoundingCircle: function () {
                    return circle;
                },
                setStatic: function (value) {
                    if (Sugar.isBoolean(value)) {
                        isStatic = value;
                    } else {
                        throw 'The argument must be a Boolean';
                    }
                },
                hitTop: function () {
                    return collisionSide.y > 0;
                },
                hitBottom: function () {
                    return collisionSide.y < 0;
                },
                hitLeft: function () {
                    return collisionSide.x > 0;
                },
                hitRight: function () {
                    return collisionSide.x < 0;
                },
                hitVertical: function () {
                    return collisionSide.y !== 0;
                },
                hitHorizontal: function () {
                    return collisionSide.x !== 0;
                },
                isStatic: function () {
                    return isStatic;
                }
            };

            return object;
        };
    }
);
