/*
 *  @module Scalable
 *  @namespace component
 *  @desc Represents a scalable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 *
 *  Only when performance issues: Remove the need for getters and setters in visible
 */
glue.module.create(
    'glue/component/scalable',
    [
        'glue',
        'glue/math/vector'
    ],
    function (Glue, Vector) {
        return function (component) {
            var Sugar = Glue.sugar,
                origin = Vector(0, 0),
                currentScale = Vector(1, 1),
                targetScale = Vector(1, 1),
                scaleSpeed = 1,
                atTarget = true;

            component = component || {};
            component.scalable = {
                update: function (deltaT) {
                    if (!atTarget) {
                        var radian,
                            deltaX,
                            deltaY;

                        deltaX = targetScale.x - currentScale.x,
                        deltaY = targetScale.y - currentScale.y;

                        // Pythagorean theorem : c = √( a2 + b2 )
                        // We stop scaling if the remaining distance to the endpoint
                        // is smaller then the step iterator (scaleSpeed * deltaT).
                        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < scaleSpeed * deltaT) {
                            atTarget = true;
                        } else {
                            // Update the x and y scale, using cos for x and sin for y
                            // and get the right speed by multiplying by the speed and delta time.
                            radian = Math.atan2(deltaY, deltaX);
                            currentScale.x += Math.cos(radian) * scaleSpeed * deltaT;
                            currentScale.y += Math.sin(radian) * scaleSpeed * deltaT;                  
                        }
                    } else {
                        currentScale = targetScale;
                    }
                },
                draw: function (deltaT, context) {
                    context.translate(origin.x, origin.y);
                    context.scale(currentScale.x, currentScale.y);
                    context.translate(-origin.x, -origin.y);
                },
                setScale: function (vec) {
                    currentScale.x = Sugar.isNumber(vec.x) ? vec.x : currentScale.x;
                    currentScale.y = Sugar.isNumber(vec.y) ? vec.y : currentScale.y;
                },
                setTarget: function (vec) {
                    targetScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    targetScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                    atTarget = false;
                },
                setSpeed: function (value) {
                    scaleSpeed = Sugar.isNumber(value) ? value : scaleSpeed;
                    scaleSpeed = Math.floor(scaleSpeed / 100);
                },
                setOrigin: function (vec) {
                    origin.x = Sugar.isNumber(vec.x) ? vec.x : origin.x;
                    origin.y = Sugar.isNumber(vec.y) ? vec.y : origin.y;
                },
                getScale: function () {
                    return currentScale;
                },
                getTarget: function () {
                    return targetScale;
                },
                getSpeed: function () {
                    return Math.floor(scaleSpeed * 100);
                },
                getOrigin: function () {
                    return origin;
                },
                atTarget: function () {
                    return atTarget;
                }
            };
            return component;
        };
    }
);
