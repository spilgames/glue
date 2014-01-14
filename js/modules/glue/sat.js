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
        'glue/math/vector',
        'glue/math/rectangle',
        'glue/math/dimension',
        'glue/game'
    ],
    function (Glue, Mathematics, Vector, Rectangle, Dimension, Game) {
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
            rectCollision = function (rect1, rect2, correction, side, rect) {
                if (rect1.intersect(rect2)) {
                    var inter = rect1.intersection(rect2),
                        direction = Vector(0, 0);
                    if (inter.x2 > inter.y2) {
                        direction.y = math.sign(rect1.y1 - rect2.y1);
                        correction.y += inter.y2 * direction.y;
                        side.y = direction.y;
                    } else {
                        direction.x = math.sign(rect1.x1 - rect2.x1)
                        correction.x += inter.x2 * direction.x;
                        side.x = direction.x;
                    }
                    rect.x1 = inter.x1;
                    rect.y1 = inter.y1;
                    rect.x2 = inter.x2;
                    rect.y2 = inter.y2;
                    return true;
                }
                return false;
            },
            overlapRect = function (rect1, rect2) {
                return rect1.intersect(rect2);
            },
            overlapCircle = function (circle1, circle2) {
                var distance = Math.sqrt(math.square(circle1.x - circle2.x) + math.square(circle1.y - circle2.y));
                return distance < circle1.radius + circle2.radius;
            },
            reflectCircle = function (obj, unit) {
                var velocity = obj.kineticable.getVelocity(),
                    bounce = obj.kineticable.getBounce(),
                    unitScale = unit.scale(velocity.dotProduct(unit)),
                    dist = velocity.static.substract(velocity, unitScale),
                    after = dist.substract(unitScale),
                    reflection = after.substract(velocity).scale(bounce);
                 velocity.add(reflection);                           
                 obj.kineticable.setVelocity(velocity);
            },
            solveCircleToCircle = function (obj1, obj2) {
                var circle1 = obj1.kineticable.toCircle(),
                    circle2 = obj2.kineticable.toCircle(),
                    correction1 = Vector(0, 0),
                    correction2 = Vector(0, 0),
                    unit1 = Vector(0, 0),
                    unit2 = Vector(0, 0),
                    position1,
                    position2;
                if (circleCollision(circle1, circle2, correction2, unit2)) {
                    if (obj2.kineticable.isDynamic()) {
                        position2 = obj2.kineticable.getPosition();
                        position2.substract(correction2);
                        reflectCircle(obj2, unit2);
                    }
                    
                    if (obj1.kineticable.isDynamic()) {
                        circleCollision(circle2, circle1, correction1, unit1);
                        position1 = obj1.kineticable.getPosition();
                        position1.substract(correction1);
                        reflectCircle(obj1, unit1);
                    }
                    return true;
                }
                return false;
            },
            solveRectangeToRectangle = function (obj1, obj2) {
                var bound1 = obj1.kineticable.toRectangle(),
                    bound2 = obj2.kineticable.toRectangle(),
                    correction1 = Vector(0, 0),
                    correction2 = Vector(0, 0),
                    side1 = Vector(0, 0),
                    side2 = Vector(0, 0),
                    velocity1,
                    velocity2,
                    position1,
                    position2,
                    intersection = Rectangle(0, 0, 0, 0);
                if (rectCollision(bound1, bound2, correction2, side2, intersection)) {
                    if (obj2.kineticable.isDynamic()) {
                        velocity2 = obj2.kineticable.getVelocity();
                        position2 = obj2.kineticable.getPosition();
                        position2.substract(correction2);
                        side2.scale(-1);
                        obj2.kineticable.setPosition(position2);
                        obj2.kineticable.setSide(side2);
                        if (side2.y !== 0) {
                            if ((side2.y > 0 && velocity2.y < 0) || (side2.y < 0 && velocity2.y > 0 && intersection.y2 > 1)) {
                                velocity2.y *= -obj2.kineticable.getBounce();
                            }
                        } else if (side2.x !== 0) {
                            if ((side2.x > 0 && velocity2.x < 0) || (side2.x < 0 && velocity2.x > 0 && intersection.x2 > 1)) {
                                velocity2.x *= -obj2.kineticable.getBounce();
                            }
                        }
                    }

                    if (obj1.kineticable.isDynamic()) {
                        velocity1 = obj1.kineticable.getVelocity();
                        position1 = obj1.kineticable.getPosition();
                        rectCollision(bound2, bound1, correction1, side1, intersection);
                        position1.substract(correction1);
                        side1.scale(-1);
                        obj1.kineticable.setPosition(position1);
                        obj1.kineticable.setSide(side1);
                        if (side1.y !== 0) {
                            if ((side1.y > 0 && velocity1.y < 0) || (side1.y < 0 && velocity1.y > 0)) {
                                velocity1.y *= -obj1.kineticable.getBounce();
                            }
                        } else if (side1.x !== 0) {
                            if ((side1.x > 0 && velocity1.x < 0) || (side1.x < 0 && velocity1.x > 0)) {
                                velocity1.x *= -obj1.kineticable.getBounce();
                            }
                        }
                    }
                    return true;
                }
                return false;
            },
            module = {
                TOP: 0,
                BOTTOM: 1,
                LEFT: 2,
                RIGHT: 3,
                RECTANGLE_TO_RECTANGLE: 10,
                CIRCLE_TO_CIRCLE: 20,
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
                        if (Sugar.isDefined(obj.kineticable)) {
                            for (i = 0, len = group.length; i < len; ++i) {
                                if (group.indexOf(obj) !== i) {
                                    module.collide(obj, group[i], type);
                                }
                            }
                        } else {
                            throw 'Collisions can only be tested between Kineticable.';
                        }
                    } else {
                        throw 'The colliding group must be an Array.';
                    }
                },
                collide: function (obj1, obj2, type) {
                    if (Sugar.isDefined(obj1.kineticable) && Sugar.isDefined(obj2.kineticable)) {
                        type = type || module.RECTANGLE_TO_RECTANGLE;
                        switch (type) {
                            case module.RECTANGLE_TO_RECTANGLE:
                                return solveRectangeToRectangle(obj1, obj2);
                                break;
                            case module.CIRCLE_TO_CIRCLE:
                                return solveCircleToCircle(obj1, obj2);
                                break;
                            default:
                                throw 'The type of collision is not valid.';
                                break;
                        }
                        return false;
                    } else {
                        throw 'Collisions can only be tested between Kineticable.';
                    }
                },
                overlap: function (obj1, obj2, type) {
                    if (Sugar.isDefined(obj1.kineticable) && Sugar.isDefined(obj2.kineticable)) {
                        type = type || module.RECTANGLE_TO_RECTANGLE;
                        switch (type) {
                            case module.RECTANGLE_TO_RECTANGLE:
                                return overlapRect(obj1, obj2);
                                break;
                            case module.CIRCLE_TO_CIRCLE:
                                return overlapCircle(obj1, obj2);
                                break;
                            default:
                                return overlapRect(obj1, obj2);
                                break;
                        }
                        return false;
                    } else {
                        throw 'Collisions can only be tested between Kineticable.';
                    }
                },
                overlapGroupVsGroup: function (group1, group2, type) {
                    var i,
                        len;
                    if (Sugar.isArray(group1) && Sugar.isArray(group2)) {
                        for (i = 0, len = group1.length; i < len; ++i) {
                            module.overlapGroup(group1[i], group2, type);
                        }
                    } else {
                        throw 'The colliding groups must be Arrays.';
                    }
                },
                overlapGroup: function (obj, group, type) {
                    var i,
                        len;
                    if (Sugar.isArray(group)) {
                        if (Sugar.isDefined(obj.kineticable)) {
                            for (i = 0, len = group.length; i < len; ++i) {
                                if (group.indexOf(obj) !== i) {
                                    module.overlap(obj, group[i], type);
                                }
                            }
                        } else {
                            throw 'Collisions can only be tested between Kineticable.';
                        }
                    } else {
                        throw 'The colliding group must be an Array.';
                    }
                },
                update: function (deltaT, scroll) {

                }
            };
        return module;
    }
);