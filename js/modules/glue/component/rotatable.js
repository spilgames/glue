/*
 *  @module Rotatable
 *  @namespace component
 *  @desc Represents a rotatable component
 *  @copyright (C) 2013 SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 *
 *  Only when performance issues: Remove the need for getters and setters in visible
 */
glue.module.create(
    'glue/component/rotatable',
    [
        'glue',
        'glue/math/vector'
    ],
    function (Glue, Vector) {
        return function (obj) {
            var Sugar = Glue.sugar,
                angle = 0,
                rotationSpeed = 100,
                targetAngle = 0,
                rotationDirection = 1,
                origin = Vector(0, 0),
                toDegree = 180 / Math.PI,
                toRadian = Math.PI / 180;
            obj = obj || {};
            obj.rotatable = {
                update: function (deltaT) {
                    var tarDeg,
                        curDeg,
                        finalSpeed,
                        distance;
                    
                    if (this.getAngleDegree() < 0) {
                        this.setAngleDegree(359);
                    } else if (this.getAngleDegree() > 360) {
                        this.setAngleDegree(1);
                    }

                    if (angle !== targetAngle) {
                        
                        tarDeg = this.getTargetAngleDegree(),
                        curDeg = this.getAngleDegree(),
                        finalSpeed = rotationSpeed * rotationDirection,
                        distance = (tarDeg > curDeg) ? (tarDeg - curDeg) : (curDeg - tarDeg);

                        if (Math.floor(Math.abs(distance)) < Math.abs(finalSpeed * deltaT)) {
                            angle = targetAngle;
                        } else {
                            curDeg += finalSpeed * deltaT;
                            this.setAngleDegree(curDeg);
                        }
                    }
                },
                draw: function (deltaT, context) {
                    context.translate(origin.x, origin.y);
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
                setOrigin: function (vec) {
                    origin.x = Sugar.isNumber(vec.x) ? vec.x : origin.x;
                    origin.y = Sugar.isNumber(vec.y) ? vec.y : origin.y;
                },
                setTargetAngleDegree: function (value, clockwise) {
                    targetAngle = Sugar.isNumber(value) ? value : targetAngle;
                    targetAngle *= toRadian;
                    if (Sugar.isDefined(clockwise)) {
                        if (clockwise) {
                            rotationDirection = 1;
                        } else {
                            rotationDirection = -1;
                        }
                    }
                },
                setTargetAngleRadian: function (value, clockwise) {
                    targetAngle = Sugar.isNumber(value) ? value : targetAngle;
                    if (Sugar.isDefined(clockwise)) {
                        if (clockwise) {
                            rotationDirection = 1;
                        } else {
                            rotationDirection = -1;
                        }
                    }
                },
                setRotationSpeed: function (value) {
                    rotationSpeed = Sugar.isNumber(value) ? value : rotationSpeed;
                },
                getAngleDegree: function () {
                    return angle * toDegree;
                },
                getAngleRadian: function () {
                    return angle;
                },
                getOrigin: function () {
                    return origin;
                },
                getTargetAngleDegree: function () {
                    return targetAngle * toDegree;
                },
                getTargetAngleRadian: function () {
                    return targetAngle;
                }
            };
            return obj;
        };
    }
);