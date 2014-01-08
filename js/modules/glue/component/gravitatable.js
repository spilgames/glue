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
        'glue/math',
        'glue/math/vector'
    ],
    function (Glue, Mathematics, Vector) {
        return function (object) {
            'use strict';
            var Sugar = Glue.sugar,
                math = Mathematics(),
                velocity = Vector(0, 0),
                gravity = Vector(0, 0),
                bounce = Vector(0, 0),
                maxVelocity = Vector(0, 0);
            object = object || {};
            object.gravitatable = {
                update: function (deltaT) {
                    var position;
                    velocity.add(gravity);
                    if (maxVelocity.x !== 0 && Math.abs(velocity.x) > maxVelocity.x) {
                        velocity.x = maxVelocity.x * math.sign(velocity.x);
                    }
                    if (maxVelocity.y !== 0 && Math.abs(velocity.y) > maxVelocity.y) {
                        velocity.y = maxVelocity.y * math.sign(velocity.y);
                    }
                    if (Sugar.isDefined(object.visible)) {
                        position = object.visible.getPosition();
                        object.visible.setPosition(position.add(velocity));
                    }
                },
                setVelocity: function (vector) {
                    if (Sugar.isVector(vector)) {
                        velocity = vector;
                    } else {
                        throw 'The argument must be a Vector';
                    }
                },
                setGravity: function (vector) {
                    if (Sugar.isVector(vector)) {
                        gravity = vector;
                    } else {
                        throw 'The argument must be a Vector';
                    }
                },
                setBounce: function (vector) {
                    if (Sugar.isVector(vector)) {
                        bounce = vector;
                    } else {
                        throw 'The argument must be a Vector';
                    }
                },
                setMaxVelocity: function (vector) {
                    if (Sugar.isVector(vector)) {
                        maxVelocity = vector;
                    } else {
                        throw 'The argument must be a Vector';
                    }
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
