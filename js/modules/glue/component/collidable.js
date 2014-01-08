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
        'glue/math/rectangle'
    ],
    function (Glue, Vector, Rectangle) {
        return function (object) {
            'use strict';
            var Sugar = Glue.sugar,
                boundingBox = Rectangle(0, 0, 0, 0),
                circle = {
                    x: 0,
                    y: 0,
                    radius: 0
                },
                isStatic = false,
                collisionSide = Vector(0, 0),
                updateBoundingBox = function () {
                    var position,
                        origin,
                        scale,
                        dimension;
                    if (Sugar.isDefined(object.animatable)) {
                        dimension = object.animatable.getDimension();
                    } else if (Sugar.isDefined(object.visible)) {
                        dimension = object.visible.getDimension();
                    } else {
                        dimension = {
                            width: 0,
                            height: 0
                        };
                    }
                    if (Sugar.isDefined(object.visible)) {
                        position = object.visible.getPosition();
                        origin = object.visible.getOrigin();
                        if (Sugar.isDefined(object.scalable)) {
                            scale = object.scalable.getScale();
                        } else {
                            scale = Vector(1, 1);
                        }
                    } else {
                        position = Vector(0, 0);
                        origin = Vector(0, 0);
                    }
                    boundingBox.x1 = position.x - origin.x * Math.abs(scale.x);
                    boundingBox.y1 = position.y - origin.y * Math.abs(scale.y);
                    boundingBox.x2 = dimension.width * Math.abs(scale.x);
                    boundingBox.y2 = dimension.height * Math.abs(scale.y);
                    circle.x = boundingBox.x1 + (boundingBox.x2 / 2);
                    circle.y = boundingBox.y1 + (boundingBox.y2 / 2);
                    circle.radius = (Math.sqrt(
                        (-boundingBox.x2 * 0.5) * (-boundingBox.x2 * 0.5) +
                        (-boundingBox.y2 * 0.5) * (-boundingBox.y2 * 0.5)
                    ));
                },
                resolveCollision = function (vector, side) {
                    if (Sugar.isDefined(object.visible) && Sugar.isVector(vector)) {
                        var position = object.visible.getPosition();
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
                update: function (deltaT) {
                    updateBoundingBox();
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
