/**
 *  @module Collision
 *  @desc Handles the collision of multiple objects.
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/collision',
    [
        'glue',
    ],
    function (Glue) {
        'use strict';
        var Sugar = Glue.sugar,
            collisionList = [],
            canCollide = function (object) {
                return Sugar.isDefined(object.collidable);
            },
            hasPhysics = function (object) {
                return Sugar.isDefined(object.physics);
            },
            resolveCollision = function (obj1, obj2) {
                if (obj1.collidable.hitTest(obj2)) {
                    var inter = obj1.collidable.getIntersectionBox(obj2),
                        box1 = obj1.collidable.getBoundingBox(),
                        box2 = obj2.collidable.getBoundingBox(),
                        bounce1 = obj1.collidable.getBounce(),
                        bounce2 = obj2.collidable.getBounce(),
                        velocity1,
                        velocity2,
                        solution = {
                            x: 0,
                            y: 0
                        };
                    if (inter.x2 > inter.y2) {
                        if (box1.y1 > box2.y1) {
                            solution.y -= inter.y2;
                        } else {
                            solution.y += inter.y2;
                        }
                    } else {
                        if (box1.x1 > box2.x1) {
                            solution.x -= inter.x2;
                        } else {
                            solution.x += inter.x2;
                        }
                    }

                    if (obj1.collidable.isFixed()) {
                        obj2.collidable.resolve(solution);
                        if (hasPhysics(obj2)) {
                            if (solution.y !== 0) {
                                if (bounce2 === 0) {
                                    obj2.physics.setVelocity({
                                        y: 0
                                    });
                                } else {
                                    velocity2 = obj2.physics.getVelocity().y;
                                    obj2.physics.setVelocity({
                                        y: velocity2 * -bounce2
                                    });
                                }
                            } else if (solution.x !== 0) {
                                if (bounce2 === 0) {
                                    obj2.physics.setVelocity({
                                        x: 0
                                    });
                                } else {
                                    velocity2 = obj2.physics.getVelocity().x;
                                    obj2.physics.setVelocity({
                                        x: velocity2 * -bounce2
                                    });
                                }
                            }
                        }
                    } else if (!obj1.collidable.isFixed() && !obj2.collidable.isFixed()) {
                        if (inter.x2 > inter.y2) {
                            if (box1.y1 > box2.y1) {
                                obj1.collidable.resolve({
                                    y: solution.y * -1
                                });
                                obj2.collidable.resolve({
                                    y: solution.y
                                });

                            } else {
                                obj2.collidable.resolve({
                                    y: solution.y * -1
                                });
                                obj1.collidable.resolve({
                                    y: solution.y
                                });
                            }

                            if (hasPhysics(obj1)) {
                                if (bounce1 === 0) {
                                    obj1.physics.setVelocity({
                                        y: 0
                                    });
                                } else {
                                    velocity1 = obj1.physics.getVelocity().y;
                                    obj1.physics.setVelocity({
                                        y: velocity1 * -bounce1
                                    });
                                }
                            }
                            if (hasPhysics(obj2)) {
                               if (bounce2 === 0) {
                                    obj2.physics.setVelocity({
                                        y: 0
                                    });
                                } else {
                                    velocity2 = obj2.physics.getVelocity().y;
                                    obj2.physics.setVelocity({
                                        y: velocity2 * -bounce2
                                    });
                                }
                            }

                        } else {
                            if (box1.x1 > box2.x1) {
                                obj1.collidable.resolve({
                                    x: solution.x * -1
                                });
                                obj2.collidable.resolve({
                                    x: solution.x
                                });
                            } else {
                                obj2.collidable.resolve({
                                    x: solution.x * -1
                                });
                                obj1.collidable.resolve({
                                    x: solution.x
                                });
                            }

                            if (hasPhysics(obj1)) {
                                if (bounce1 === 0) {
                                    obj1.physics.setVelocity({
                                        x: 0
                                    });
                                } else {
                                    velocity1 = obj1.physics.getVelocity().x;
                                    obj1.physics.setVelocity({
                                        x: velocity1 * -bounce1
                                    });
                                }
                            }
                            if (hasPhysics(obj2)) {
                               if (bounce2 === 0) {
                                    obj2.physics.setVelocity({
                                        x: 0
                                    });
                                } else {
                                    velocity2 = obj2.physics.getVelocity().x;
                                    obj2.physics.setVelocity({
                                        x: velocity2 * -bounce2
                                    });
                                }
                            }
                        }
                    }
                }
            },
            update = function () {
                var i,
                    len;
                for (i = 0, len = collisionList.length; i < len; ++i) {
                    for (var j = 0, jlen = collisionList.length; j < jlen; ++j) {
                        if (j !== i) {
                            resolveCollision(collisionList[i], collisionList[j]);
                        }
                    }
                }
            },
            module = {
                add: function (object) {
                    if (canCollide(object)) {
                        collisionList[collisionList.length] = object;
                    }
                },
                remove: function (object) {
                    var index = collisionList.indexOf(object);
                    if (index >= 0) {
                        collisionList.splice(index, 1);
                    }
                },
                update: function (deltaT) {
                    update();
                }
            };
        return module;
    }
);
