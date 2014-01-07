/*
 *  @module Physics
 *  @namespace component
 *  @desc Represents a physics component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/physics',
    [
        'glue',
        'glue/math/vector'
    ],
    function (Glue, Vector) {
        return function (object) {
            'use strict';
            var Sugar = Glue.sugar,
                velocity = Vector(0, 0),
                acceleration = Vector(0, 0);

            object = object || {};
            object.physics = {
                update: function (deltaT) {
                    var position;
                    velocity.add(acceleration);
                    if (Sugar.isDefined(object.visible)) {
                        position = object.visible.getPosition();
                        position.x += velocity.x;
                        position.y += velocity.y;
                        object.visible.setPosition(position);
                    }
                },
                setVelocity: function (vec) {
                    velocity.x = Sugar.isNumber(vec.x) ? vec.x : velocity.x;
                    velocity.y = Sugar.isNumber(vec.y) ? vec.y : velocity.y;
                },
                setAcceleration: function (vec) {
                    acceleration.x = Sugar.isNumber(vec.x) ? vec.x : velocity.x;
                    acceleration.y = Sugar.isNumber(vec.y) ? vec.y : velocity.y;
                },
                resetVelocity: function () {
                    velocity.x = 0;
                    velocity.y = 0;
                },
                resetAcceleration: function () {
                    acceleration.x = 0;
                    acceleration.y = 0;
                },
                reset: function () {
                    this.resetVelocity();
                    this.resetAcceleration();
                },
                getVelocity: function () {
                    return velocity;
                },
                getAcceleration: function () {
                    return acceleration;
                },
            };
            return object;
        };
    }
);
