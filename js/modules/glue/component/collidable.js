/*
 *  @module Collisionable
 *  @namespace component
 *  @desc Represents a collisionable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/collidable',
    [
        'glue',
        'glue/math/rectangle'
    ],
    function (Glue, Rectangle) {
        return function (object) {
            'use strict';
            var Sugar = Glue.sugar,
                fixed = false,
                box = Rectangle(0,0,0,0),
                updateBox = function () {
                    var dimension,
                        position;
                    if (Sugar.isDefined(object.animatable)) {
                        dimension = object.animatable.getDimension();
                        position = object.animatable.getPosition();
                    } else if (Sugar.isDefined(object.visible)) {
                        dimension = object.visible.getDimension();
                        position = object.visible.getPosition();
                    } else {
                        dimension = {width: 0, height: 0};
                        position = {x: 0, y: 0};
                    }
                    box.x1 = position.x;
                    box.y1 = position.y;
                    box.x2 = dimension.width;
                    box.y2 = dimension.height;

                },
                getBox = function (obj) {
                    var dimension,
                        position;
                    if (Sugar.isDefined(obj.animatable)) {
                        dimension = obj.animatable.getDimension();
                        position = obj.animatable.getPosition();
                    } else if (Sugar.isDefined(obj.visible)) {
                        dimension = obj.visible.getDimension();
                        position = obj.visible.getPosition();
                    } else {
                        dimension = {width: 0, height: 0};
                        position = {x: 0, y: 0};
                    }
                    return Rectangle(position.x, position.y, dimension.width, dimension.height);
                };
            object = object || {};
            object.collidable = {
                update: function (deltaT) {
                    updateBox();
                },
                setFixed: function (value) {
                    fixed = Sugar.isBoolean(value) ? value : fixed;
                },
                setBoundingBox: function (rectangle) {
                    box = Sugar.isDefined(rectangle) ? rectangle : box;
                },
                hitTest: function (testBox) {
                    var box2 = getBox(testBox);
                    if (box2 !== null && box !== null) {
                        return box.intersect(box2);
                    }
                    return false;
                },
                getIntersectionBox: function (testBox) {
                    var box2 = getBox(testBox);
                    if (box2 !== null && box !== null) {
                        return box.intersection(box2);
                    }
                    return null;
                },
                resolve: function (vec) {
                    var position;
                    if (Sugar.isDefined(object.visible)) {
                        position = object.visible.getPosition();
                        object.visible.setPosition({
                            x: position.x + vec.x,
                            y: position.y + vec.y
                        });
                    }
                },
                isFixed: function () {
                    return fixed;
                },
                getBoundingBox: function () {
                    return box;
                }
            };

            return object;
        };
    }
);
