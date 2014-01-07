/**
 *  @module SAT (Separating Axis Theorem)
 *  @desc Handles the collision between two rectangles.
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/sat',
    [
        'glue',
        'glue/math/vector'
    ],
    function (Glue, Vector) {
        'use strict';
        var Sugar = Glue.sugar,
            sgn = function (x) {
                return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
            },
            rectCollision = function (rect1, rect2, correction, side) {
                var horizontalOverlap,
                    horizontalDirection,
                    verticalOverlap,
                    verticalDirection,
                    halfSize1 = {
                        width: rect1.x2 / 2,
                        height: rect1.y2 / 2,
                        x: rect1.x1 + rect1.x2 / 2,
                        y: rect1.y1 + rect1.y2 / 2
                    },
                    halfSize2 = {
                        width: rect2.x2 / 2,
                        height: rect2.y2 / 2,
                        x: rect2.x1 + rect2.x2 / 2,
                        y: rect2.y1 + rect2.y2 / 2
                    };
                correction.x = correction.y = 0;
                horizontalOverlap = halfSize1.width + halfSize2.width - Math.abs(halfSize1.x - halfSize2.x);
                if (horizontalOverlap <= 0) {
                    return false;
                }
                horizontalDirection = sgn(halfSize1.x - halfSize2.x);
                side.horizontal = horizontalDirection;
                verticalOverlap = halfSize1.height + halfSize2.height - Math.abs(halfSize1.y - halfSize2.y);
                if (verticalOverlap <= 0) {
                    return false;
                }
                verticalDirection = sgn(halfSize1.y - halfSize2.y);
                side.vertical = verticalDirection;
                if (horizontalOverlap < verticalOverlap) {
                    correction.x += horizontalDirection * horizontalOverlap;
                } else {
                    correction.y += verticalDirection * verticalOverlap;
                }
                return true;
            },
            module = {
                sgn: sgn,
                collideGroupVsGroup: function (group1, group2) {
                    var i,
                        len;
                    if (Sugar.isArray(group1) && Sugar.isArray(group2)) {
                        for (i = 0, len = group1.length; i < len; ++i) {
                            module.collideGroup(group1[i], group2);
                        }
                    } else {
                        throw 'The colliding groups must be Arrays.';
                    }
                },
                collideGroup: function (obj, group) {
                    var i,
                        len;
                    if (Sugar.isArray(group)) {
                        if (Sugar.isDefined(obj.collisionable)) {
                            for (i = 0, len = group.length; i < len; ++i) {
                                if (group.indexOf(obj) < 0) {
                                    module.collide(obj, group[i]);
                                }
                            }
                        } else {
                            throw 'Collisions can only be tested between Collisionable';
                        }
                    } else {
                        throw 'The colliding group must be an Array.';
                    }
                },
                collide: function (obj1, obj2) {
                    if (Sugar.isDefined(obj1.collisionable) && Sugar.isDefined(obj2.collisionable)) {
                        var box1 = obj1.collisionable.getBoundingBox(),
                            box2 = obj2.collisionable.getBoundingBox(),
                            correction = Vector(0, 0),
                            side = {vertical: 0, horizontal: 0},
                            bounce,
                            velocity;
                        
                        if (rectCollision(box1, box2, correction, side)) {
                            if (!obj2.collisionable.isStatic()) { 
                                obj2.collisionable.resolveCollision(correction, side);
                                if (Sugar.isDefined(obj2.gravitatable)) {
                                    velocity = obj2.gravitatable.getVelocity(),
                                    bounce = obj2.gravitatable.getBounce();
                                    if (correction.y !== 0) {
                                        velocity.y *= -bounce.y;
                                    } else if (correction.x !== 0){
                                        velocity.x *= -bounce.x;
                                    }
                                    obj2.gravitatable.setVelocity(velocity);
                                }
                            }
                            correction.x *= -1;
                            correction.y *= -1;
                            side.vertical *= -1;
                            side.horizontal *= -1;
                            if (!obj1.collisionable.isStatic()) { 
                                obj1.collisionable.resolveCollision(correction, side);
                                if (Sugar.isDefined(obj1.gravitatable)) {
                                    velocity = obj1.gravitatable.getVelocity(),
                                    bounce = obj1.gravitatable.getBounce();
                                    if (correction.y !== 0) {
                                        velocity.y *= -bounce.y;
                                    } else if (correction.x !== 0){
                                        velocity.x *= -bounce.x;
                                    }
                                    obj1.gravitatable.setVelocity(velocity);
                                }
                            }
                            return true;
                        }
                        return false;

                    } else {
                        throw 'Collisions can only be tested between Collisionable';
                    }
                }
            };
        return module;
    }
);
