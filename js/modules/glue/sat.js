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
            sq = function (x) {
                return x * x;
            },
            circleCollision = function (circle1, circle2, correction, unit) {
                var distance;
                correction.x = circle1.x;
                correction.y = circle1.y;
                correction.x -= circle2.x;
                correction.y -= circle2.y;
                distance = Math.sqrt(sq(correction.x) + sq(correction.y));
                if (distance > circle1.radius + circle2.radius) {
                    correction.x = correction.y = 0;
                    return false;
                }
                correction.x /= distance > 0 ? distance : 1;
                correction.y /= distance > 0 ? distance : 1;
                unit.x = correction.x;
                unit.y = correction.y;
                correction.x *= (circle1.radius + circle2.radius) - distance;
                correction.y *= (circle1.radius + circle2.radius) - distance;
                return true;
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
            dotP = function (v1, v2) {
                return (v1.x * v2.x + v1.y * v2.y);
            },
            reflectCircle = function (obj, unit) {
                var velocity = obj.gravitatable.getVelocity(),
                    bounce = obj.gravitatable.getBounce().x * obj.gravitatable.getBounce().y,
                    u = Vector(
                        unit.x * dotP(velocity, unit),
                        unit.y * dotP(velocity, unit)
                    ),
                    w = Vector(
                        velocity.x - u.x,
                        velocity.y - u.y
                    ),
                    after = Vector(
                        w.x - u.x,
                        w.y - u.y
                    ),
                    ref = Vector(
                        (after.x - velocity.x) * bounce,
                        (after.y - velocity.y) * bounce
                    );
                velocity.x += ref.x;
                velocity.y += ref.y;                            
                obj.gravitatable.setVelocity(velocity);
            },
            solveCircleToCircle = function (obj1, obj2) {
                var circle1 = obj1.collisionable.getBoundingCircle(),
                    circle2 = obj2.collisionable.getBoundingCircle(),
                    correction = Vector(0, 0),
                    unit = Vector(0, 0);

                if (circleCollision(circle1, circle2, correction, unit)) {
                    if (!obj2.collisionable.isStatic()) {
                        obj2.collisionable.resolveCollision(correction);
                        if (Sugar.isDefined(obj2.gravitatable)) {
                            reflectCircle(obj2, unit);
                        }
                    }
                    correction.x *= -1;
                    correction.y *= -1;
                    if (!obj1.collisionable.isStatic()) {
                        obj1.collisionable.resolveCollision(correction);
                        if (Sugar.isDefined(obj1.gravitatable)) {
                            reflectCircle(obj1, unit);
                        }
                    }
                    return true;
                }
                return false;
            },
            solveRectangeToRectangle = function (obj1, obj2) {
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
            },
            module = {
                sgn: sgn,
                RECTANGLE_TO_RECTANGLE: 0,
                CIRCLE_TO_CIRCLE: 1,
                collideGroupVsGroup: function (group1, group2, type) {
                    var i,
                        len;
                    if (Sugar.isArray(group1) && Sugar.isArray(group2)) {
                        for (i = 0, len = group1.length; i < len; ++i) {
                            module.collideGroup(group1[i], group2, type);
                        }
                    } else {
                        throw 'The colliding groups must be Arrays.';
                    }
                },
                collideGroup: function (obj, group, type) {
                    var i,
                        len;
                    if (Sugar.isArray(group)) {
                        if (Sugar.isDefined(obj.collisionable)) {
                            for (i = 0, len = group.length; i < len; ++i) {
                                if (group.indexOf(obj) < 0) {
                                    module.collide(obj, group[i], type);
                                }
                            }
                        } else {
                            throw 'Collisions can only be tested between Collisionable';
                        }
                    } else {
                        throw 'The colliding group must be an Array.';
                    }
                },
                collide: function (obj1, obj2, type) {
                    if (Sugar.isDefined(obj1.collisionable) && Sugar.isDefined(obj2.collisionable)) {
                        type = type || 0;
                        switch (type) {
                            case module.RECTANGLE_TO_RECTANGLE:
                                return solveRectangeToRectangle(obj1, obj2);
                                break;
                            case module.CIRCLE_TO_CIRCLE:
                                return solveCircleToCircle(obj1, obj2);
                                break;
                            default:
                                return solveRectangeToRectangle(obj1, obj2);
                                break;
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
