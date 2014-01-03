/*
 *  @module Scalable
 *  @namespace component
 *  @desc Represents a scalable component
 *  @copyright (C) 2013 SpilGames
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
                atTarget = true,
                equals = function (v1, v2) {
                    return v1.x === v2.x && v1.y === v2.y;
                };

            component = component || {};
            component.scalable = {
                update: function (deltaT) {
                    if (!equals(currentScale, targetScale)) {
                        var radian,
                            deltaX,
                            deltaY;

                        deltaX = targetScale.x - currentScale.x,
                        deltaY = targetScale.y - currentScale.y;

                        // Pythagorean theorem : c = √( a2 + b2 )
                        // We stop scaling if the remaining distance to the endpoint
                        // is smaller then the step iterator (scaleSpeed * deltaT).
                        if (!atTarget && Math.sqrt(deltaX * deltaX + deltaY * deltaY) < scaleSpeed * deltaT) {
                            atTarget = true;
                            this.setScale(targetScale);
                        } else {
                            // Update the x and y scale, using cos for x and sin for y
                            // and get the right speed by multiplying by the speed and delta time.
                            radian = Math.atan2(deltaY, deltaX);
                            currentScale.x += Math.cos(radian) * scaleSpeed * deltaT;
                            currentScale.y += Math.sin(radian) * scaleSpeed * deltaT;         
                        }
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
                    scaleSpeed = Sugar.isNumber(value) ? (value / 100) : scaleSpeed;
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
                },
                getDimension: function () {
                    var dimension;
                    if (Sugar.isDefined(component.animatable)) {
                        dimension = component.animatable.getDimension();
                    } else if (Sugar.isDefined(component.visible)) {
                        dimension = component.visible.getDimension();
                    } else {
                        dimension = Dimension(1, 1);
                    }

                    return Dimension(
                            dimension.width * currentScale.x,
                            dimension.height * currentScale.y
                        ); 
                }
            };
            return component;
        };
    }
);
