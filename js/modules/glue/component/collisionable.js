/*
 *  @module Collisionable
 *  @namespace component
 *  @desc Represents a collisionable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/collisionable',
    [
        'glue',
        'glue/sat',
        'glue/math/vector',
        'glue/math/rectangle'
    ],
    function (Glue, SAT, Vector, Rectangle) {
        return function (object) {
            'use strict';
            var Sugar = Glue.sugar,
                boundingBox = Rectangle(0, 0, 0, 0),
                isStatic = false,
                collisionSide = {
                    vertical: 0,
                    horizontal: 0
                },
                updateBoundingBox = function () {
                    var position,
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
                    } else {
                        position = Vector(0, 0);
                    }
                    boundingBox.x1 = position.x;
                    boundingBox.y1 = position.y;
                    boundingBox.x2 = dimension.width;
                    boundingBox.y2 = dimension.height;
                },
                resolveCollision = function (vec, side) {
                    if (Sugar.isDefined(object.visible)) {
                        var position = object.visible.getPosition();
                        vec.x = vec.x || 0;
                        vec.y = vec.y || 0;
                        object.visible.setPosition({
                            x: position.x - vec.x,
                            y: position.y - vec.y
                        });
                        collisionSide.vertical = side.vertical * -1;
                        collisionSide.horizontal = side.horizontal * -1;
                    }
                };

            object = object || {};
            object.collisionable = {
                resolveCollision: resolveCollision,
                update: function (deltaT) {
                    updateBoundingBox();
                },
                getBoundingBox: function () {
                    return boundingBox;
                },
                setStatic: function (value) {
                    isStatic = Sugar.isBoolean(value) ? value : isStatic;
                },
                hitTop: function () {
                    return collisionSide.vertical > 0;
                },
                hitBottom: function () {
                    return collisionSide.vertical < 0;
                },
                hitLeft: function () {
                    return collisionSide.horizontal > 0;
                },
                hitRight: function () {
                    return collisionSide.horizontal < 0;
                },
                hitVertical: function () {
                    return collisionSide.vertical !== 0;
                },
                hitHorizontal: function () {
                    return collisionSide.horizontal !== 0;
                },
                isStatic: function () {
                    return isStatic;
                }
            };

            return object;
        };
    }
);
