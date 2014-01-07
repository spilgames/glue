/*
 *  @module Gravitatable
 *  @namespace component
 *  @desc Represents a gravitatable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/gravitatable',
    [
        'glue',
        'glue/sat',
        'glue/math/vector'
    ],
    function (Glue, SAT, Vector) {
        return function (object) {
            'use strict';
            var Sugar = Glue.sugar,
                velocity = Vector(0, 0),
                gravity = Vector(0, 0),
                bounce = Vector(0, 0),
                maxVelocity = {};

            object = object || {};
            object.gravitatable = {
                update: function (deltaT) {
                    velocity.x += gravity.x;
                    velocity.y += gravity.y;
                    if (Sugar.isDefined(maxVelocity)) {
                        if (Sugar.isNumber(maxVelocity.x)) {
                            if (Math.abs(velocity.x) > maxVelocity.x) {
                                velocity.x = maxVelocity.x * SAT.sgn(velocity.x);
                            }
                        }
                        if (Sugar.isNumber(maxVelocity.y)) {
                            if (Math.abs(velocity.y) > maxVelocity.y) {
                                velocity.y = maxVelocity.y * SAT.sgn(velocity.y);
                            }
                        }
                    }
                    var position;
                    if (Sugar.isDefined(object.visible)) {
                        position = object.visible.getPosition();
                        object.visible.setPosition({
                            x: position.x + velocity.x,
                            y: position.y + velocity.y
                        });
                    }
                },
                setVelocity: function (vec) {
                    velocity.x = Sugar.isNumber(vec.x) ? vec.x : velocity.x;
                    velocity.y = Sugar.isNumber(vec.y) ? vec.y : velocity.y;
                },
                setGravity: function (vec) {
                    gravity.x = Sugar.isNumber(vec.x) ? vec.x : gravity.x;
                    gravity.y = Sugar.isNumber(vec.y) ? vec.y : gravity.y;
                },
                setBounce: function (vec) {
                    bounce.x = Sugar.isNumber(vec.x) ? vec.x : bounce.x;
                    bounce.y = Sugar.isNumber(vec.y) ? vec.y : bounce.y;
                },
                setMaxVelocity: function (vec) {
                    maxVelocity = vec;
                },
                getVelocity: function () {
                    return velocity;
                },
                getGravity: function () {
                    return gravity;
                },
                getBounce: function () {
                    return bounce;
                },
                getMaxVelocity: function () {
                    return maxVelocity;
                }
            };
            return object;
        };
    }
);
