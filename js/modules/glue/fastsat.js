/**
 *  @module SAT (Separating Axis Theorem)
 *  @desc Handles the collision between two rectangles.
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/fastsat',
    [
        'glue',
        'glue/math',
        'glue/math/vector',
        'glue/math/rectangle',
        'glue/math/dimension',
        'glue/game',
        'glue/spatial'
    ],
    function (Glue, Mathematics, Vector, Rectangle, Dimension, Game, Spatial) {
        'use strict';
        var Sugar = Glue.sugar,
            math = Mathematics(),
            spatial = Spatial(),
            check = [],
            rectangleOverlap = function (rectangle1, rectangle2) {
                var intersect;
                if (rectangle1.intersect(rectangle2)) {
                    return true;
                }
                return false;
            },
            collideRectangles = function (rectangle1, rectangle2, correction, side, rectangle) {
                var intersection = rectangle1.intersection(rectangle2),
                    direction = Vector(0, 0);

                if (intersection.x2 > intersection.y2) {
                    direction.y = math.sign(rectangle1.y1 - rectangle2.y1);
                    correction.y += intersection.y2 * direction.y;
                    side.y = direction.y;
                } else {
                    direction.x = math.sign(rectangle1.x1 - rectangle2.x1)
                    correction.x += intersection.x2 * direction.x;
                    side.x = direction.x;
                }
                rectangle.x1 = intersection.x1;
                rectangle.y1 = intersection.y1;
                rectangle.x2 = intersection.x2;
                rectangle.y2 = intersection.y2;
            },
            rectangleCollision = function (obj1, obj2) {
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

                if (obj1.kineticable.isDynamic()) {
                    velocity1 = obj1.kineticable.getVelocity();
                    position1 = obj1.kineticable.getPosition();
                    collideRectangles(bound2, bound1, correction1, side1, intersection);
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
                if (obj2.kineticable.isDynamic()) {
                    collideRectangles(bound1, bound2, correction2, side2, intersection);
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
            },
            resetSpatial = function () {
                spatial.clearObjects();
                spatial.addArray(check);
            },
            module = {
                setup: function (config) {
                    spatial.setup({
                        gridDimension: Dimension(800, 600),
                        gridSize: 100
                    });
                    //spatial.setDebug(true);
                },
                addObject: function (object) {
                    if (Sugar.isDefined(object.kineticable)) {
                        check.push(object);
                    }
                },
                collide: function (object) {
                    var nearby,
                        i = 0,
                        ln,
                        nearbyObject;
                        //overlap = [];

                    //resetSpatial();
                    if (Sugar.isDefined(object.kineticable)) {
                        nearby = spatial.getNearbyObjects(object);
                        //console.log(nearby);
                        for (i, ln = nearby.length; i < ln; ++i) {
                            nearbyObject = nearby[i];
                            if (nearbyObject) {
                                if (rectangleOverlap(object.kineticable.toRectangle(),
                                    nearbyObject.kineticable.toRectangle())) {
                                    //console.log("overlaps", nearbyObject.getName());
                                    //overlap.push(nearbyObject);
                                    rectangleCollision(object, nearbyObject);
                                }
                            }
                        }
                    }
                    //return overlap;
                }
            };

        return module;
    }
);
