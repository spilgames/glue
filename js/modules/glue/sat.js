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
        'glue/math',
        'glue/math/vector'
    ],
    function (Glue, Mathematics, Vector) {
        'use strict';
        var Sugar = Glue.sugar,
            math = Mathematics(),
            circleCollision = function (circle1, circle2, correction, unit) {
                var distance;
                correction.copy(circle1);
                correction.substract(circle2);
                distance = correction.length();
                if (distance > circle1.radius + circle2.radius) {
                    correction.x = correction.y = 0;
                    return false;
                }
                correction.normalize(distance);
                unit.copy(correction);
                correction.scale((circle1.radius + circle2.radius) - distance);
                return true;
            },
            rectCollision = function (rect1, rect2, correction, side) {
                var horizontalOverlap,
                    horizontalDirection,
                    verticalOverlap,
                    verticalDirection,
                    halfSize1 = math.getHalfRectangle(rect1),
                    halfSize2 = math.getHalfRectangle(rect2);
                correction.x = correction.y = 0;
                horizontalOverlap = halfSize1.x2 + halfSize2.x2 - Math.abs(halfSize1.x1 - halfSize2.x1);
                if (horizontalOverlap <= 0) {
                    return false;
                }
                horizontalDirection = math.sign(halfSize1.x1 - halfSize2.x1);
                side.x = horizontalDirection;
                verticalOverlap = halfSize1.y2 + halfSize2.y2 - Math.abs(halfSize1.y1 - halfSize2.y1);
                if (verticalOverlap <= 0) {
                    return false;
                }
                verticalDirection = math.sign(halfSize1.y1 - halfSize2.y1);
                side.y = verticalDirection;
                if (horizontalOverlap < verticalOverlap) {
                    correction.x += horizontalDirection * horizontalOverlap;
                } else {
                    correction.y += verticalDirection * verticalOverlap;
                }
                return true;
            },
            reflectCircle = function (obj, unit) {
                var velocity = obj.gravitatable.getVelocity(),
                    bounce = obj.gravitatable.getBounce().x * obj.gravitatable.getBounce().y,
                    unitScale = unit.scale(velocity.dotProduct(unit)),
                    dist = velocity.static.substract(velocity, unitScale),
                    after = dist.substract(unitScale),
                    reflection = after.substract(velocity).scale(bounce);
                 velocity.add(reflection);                           
                 obj.gravitatable.setVelocity(velocity);
            },
            solveCircleToCircle = function (obj1, obj2) {
                var circle1 = obj1.collidable.getBoundingCircle(),
                    circle2 = obj2.collidable.getBoundingCircle(),
                    correction = Vector(0, 0),
                    unit = Vector(0, 0);

                if (circleCollision(circle1, circle2, correction, unit)) {
                    if (!obj2.collidable.isStatic()) {
                        obj2.collidable.resolveCollision(correction);
                        if (Sugar.isDefined(obj2.gravitatable)) {
                            reflectCircle(obj2, unit);
                        }
                    }
                    circleCollision(circle2, circle1, correction, unit)
                    if (!obj1.collidable.isStatic()) {
                        obj1.collidable.resolveCollision(correction);
                        if (Sugar.isDefined(obj1.gravitatable)) {
                            reflectCircle(obj1, unit);
                        }
                    }
                    return true;
                }
                return false;
            },
            solveRectangeToRectangle = function (obj1, obj2) {
                var box1 = obj1.collidable.getBoundingBox(),
                    box2 = obj2.collidable.getBoundingBox(),
                    correction = Vector(0, 0),
                    side = Vector(0, 0),
                    bounce,
                    velocity;
                
                if (rectCollision(box1, box2, correction, side)) {
                    if (!obj2.collidable.isStatic()) { 
                        obj2.collidable.resolveCollision(correction, side);
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
                    if (!obj1.collidable.isStatic()) { 
                        rectCollision(box2, box1, correction, side);
                        obj1.collidable.resolveCollision(correction, side);
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
                        if (Sugar.isDefined(obj.collidable)) {
                            for (i = 0, len = group.length; i < len; ++i) {
                                if (group.indexOf(obj) !== i) {
                                    module.collide(obj, group[i], type);
                                }
                            }
                        } else {
                            throw 'Collisions can only be tested between collidable';
                        }
                    } else {
                        throw 'The colliding group must be an Array.';
                    }
                },
                collide: function (obj1, obj2, type) {
                    if (Sugar.isDefined(obj1.collidable) && Sugar.isDefined(obj2.collidable)) {
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
                        throw 'Collisions can only be tested between collidable';
                    }
                }
            };
        return module;
    }
);