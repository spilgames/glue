/*
 *  @module Rotatable
 *  @namespace component
 *  @desc Represents a rotatable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/rotatable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math/vector',
        'glue/math'
    ],
    function (Glue, BaseComponent, Vector, Mathematics) {
        'use strict';
        var Sugar = Glue.sugar,
            math = Mathematics();

        return function (object) {
            var baseComponent = BaseComponent('rotatable', object),
                angle = 0,
                rotationSpeed = 0.01, // Speed should be between 0 and 1
                targetAngle = 0,
                rotationDirection = 1,
                toDegree = 180 / Math.PI,
                atTarget = true,
                toRadian = Math.PI / 180,
                lastAngle = 0,
                angleValue = 1;

            baseComponent.set({
                update: function (deltaT) {
                    if (!atTarget) {
                        angle = math.lerp(angleValue, lastAngle, targetAngle);
                        if (angleValue >= 1) {
                            atTarget = true;
                            this.rotatable.setAngleRadian(angle);
                        }
                        angleValue += rotationSpeed;
                    }
                },
                draw: function (deltaT, context) {
                    context.rotate(angle);
                },
                setAngleDegree: function (value) {
                    angle = Sugar.isNumber(value) ? value : angle;
                    angle *= toRadian;
                    lastAngle = angle;
                    angleValue = 1;
                },
                setAngleRadian: function (value) {
                    angle = Sugar.isNumber(value) ? value : angle;
                    lastAngle = angle;
                    angleValue = 1;
                },
                setTargetDegree: function (value) {
                    targetAngle = Sugar.isNumber(value) ? value : targetAngle;
                    targetAngle *= toRadian;
                    atTarget = false;
                    angleValue = 0;
                },
                setTargetRadian: function (value) {
                    targetAngle = Sugar.isNumber(value) ? value : targetAngle;
                    atTarget = false;
                    angleValue = 0;
                },
                setSpeed: function (value) {
                    rotationSpeed = Sugar.isNumber(value) ? value : rotationSpeed;
                },
                getAngleDegree: function () {
                    return angle * toDegree;
                },
                getAngleRadian: function () {
                    return angle;
                },
                getTargetDegree: function () {
                    return targetAngle * toDegree;
                },
                getTargetRadian: function () {
                    return targetAngle;
                },
                atTarget: function () {
                    return atTarget;
                }
            });

            baseComponent.register('update');
            baseComponent.register('draw');

            return object;
        };
    }
);
