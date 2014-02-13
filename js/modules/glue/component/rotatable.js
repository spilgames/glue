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
        'glue/math/vector'
    ],
    function (Glue, Vector) {
        return function (object) {
            var Sugar = Glue.sugar,
                angle = 0,
                rotationSpeed = 100,
                targetAngle = 0,
                rotationDirection = 1,
                toDegree = 180 / Math.PI,
                atTarget = true,
                toRadian = Math.PI / 180;
                origin = Vector(0, 0);

            object = object || {};
            object.rotatable = {
                update: function (deltaT) {
                    var tarDeg,
                        curDeg,
                        finalSpeed,
                        distance,
                        self = object.rotatable;
                    
                    if (self.getAngleDegree() < 0) {
                        self.setAngleDegree(359);
                    } else if (self.getAngleDegree() > 360) {
                        self.setAngleDegree(1);
                    }
                    if (angle !== targetAngle) {
                        tarDeg = self.getTargetDegree(),
                        curDeg = self.getAngleDegree(),
                        finalSpeed = rotationSpeed * rotationDirection,
                        distance = (tarDeg > curDeg) ? (tarDeg - curDeg) : (curDeg - tarDeg);

                        if (Math.floor(Math.abs(distance)) < Math.abs(finalSpeed * deltaT)) {
                            angle = targetAngle;
                            atTarget = true;
                        } else {
                            curDeg += finalSpeed * deltaT;
                            self.setAngleDegree(curDeg);
                        }
                    }
                },
                draw: function (deltaT, context) {
                    context.rotate(angle);
                    context.translate(-origin.x, -origin.y);
                },
                setAngleDegree: function (value) {
                    angle = Sugar.isNumber(value) ? value : angle;
                    angle *= toRadian;
                },
                setAngleRadian: function (value) {
                    angle = Sugar.isNumber(value) ? value : angle;
                },
                setTargetDegree: function (value, clockwise) {
                    targetAngle = Sugar.isNumber(value) ? value : targetAngle;
                    targetAngle *= toRadian;
                    if (Sugar.isDefined(clockwise)) {
                        if (clockwise) {
                            rotationDirection = 1;
                        } else {
                            rotationDirection = -1;
                        }
                    }
                    atTarget = false;
                },
                setTargetRadian: function (value, clockwise) {
                    targetAngle = Sugar.isNumber(value) ? value : targetAngle;
                    if (Sugar.isDefined(clockwise)) {
                        if (clockwise) {
                            rotationDirection = 1;
                        } else {
                            rotationDirection = -1;
                        }
                    }
                    atTarget = false;
                },
                setSpeed: function (value) {
                    rotationSpeed = Sugar.isNumber(value) ? value : rotationSpeed;
                    rotationSpeed = Math.floor(rotationSpeed);
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
                },
                setOrigin: function (vec) {
                    origin.x = Sugar.isNumber(vec.x) ? vec.x : origin.x;
                    origin.y = Sugar.isNumber(vec.y) ? vec.y : origin.y;
                },
                getOrigin: function () {
                    return origin;
                }
            };

            object.register('update', object.rotatable.update, 'rotatable');
            object.register('draw', object.rotatable.draw, 'rotatable');

            return object;
        };
    }
);
