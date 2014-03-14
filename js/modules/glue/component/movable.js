/*
 *  @module Movable
 *  @namespace component
 *  @desc Represents an movable component
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/movable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math/vector'
    ],
    function (Glue, BaseComponent, Vector) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('movable', object),
                position,
                targetPosition = null,
                moveSpeed = 100,
                atTarget = true,
                rotation = 0;

            baseComponent.set({
                update: function (gameData) {
                    var deltaT = gameData.deltaT;
                    if (targetPosition !== null) {
                        var radian,
                            deltaX,
                            deltaY;

                        position = object.getPosition();
                        deltaX = targetPosition.x - position.x,
                        deltaY = targetPosition.y - position.y;

                        // Pythagorean theorem : c = √( a2 + b2 )
                        // We stop moving if the remaining distance to the endpoint
                        // is smaller then the step iterator (moveSpeed * deltaT).
                        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < moveSpeed * deltaT) {
                            atTarget = true;
                            position = targetPosition;
                            object.setPosition(position);
                        } else {
                            // Update the x and y position, using cos for x and sin for y
                            // and get the right speed by multiplying by the speed and delta time.
                            radian = Math.atan2(deltaY, deltaX);
                            position.x += Math.cos(radian) * moveSpeed * deltaT;
                            position.y += Math.sin(radian) * moveSpeed * deltaT;
                            rotation = radian * 180 / Math.PI;
                            object.setPosition(position);                      
                        }
                    }
                },
                hasTarget: function () {
                    return targetPosition !== null;
                },
                atTarget: function () {
                    return atTarget;
                },
                getRotation: function () {
                    return rotation;
                },
                setTarget: function (target) {
                    if (!Sugar.isObject(target) && Sugar.isDefined(target.x) &&
                        Sugar.isDefined(target.y)) {
                            throw 'Invalid target supplied';
                    }
                    atTarget = false;
                    targetPosition = target;
                },
                setMoveSpeed: function (speed) {
                    if (!Sugar.isNumber(speed)) {
                        throw 'Invalid speed supplied';
                    }
                    moveSpeed = speed;
                },
                register: function () {
                    baseComponent.register('update');
                },
                unregister: function () {
                    baseComponent.unregister('update');
                }
            });

            return object;
        };
    }
);
