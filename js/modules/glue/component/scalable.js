/*
 *  @module Scalable
 *  @namespace component
 *  @desc Represents a scalable component
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/scalable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math/vector',
        'glue/math/dimension'
    ],
    function (Glue, BaseComponent, Vector, Dimension) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (object) {
            var baseComponent = BaseComponent('scalable', object),
                currentScale = Vector(1, 1),
                targetScale = Vector(1, 1),
                scaleSpeed = 1,
                atTarget = true;

            baseComponent.set({
                update: function (gameData) {
                    if (!atTarget) {
                        var deltaT = gameData.deltaT,
                            radian,
                            deltaX,
                            deltaY,
                            self = this.scalable;

                        deltaX = targetScale.x - currentScale.x,
                        deltaY = targetScale.y - currentScale.y;

                        // Pythagorean theorem : c = √( a2 + b2 )
                        // We stop scaling if the remaining distance to the endpoint
                        // is smaller then the step iterator (scaleSpeed * deltaT).
                        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < scaleSpeed * deltaT) {
                            atTarget = true;
                            self.setScale(targetScale);
                        } else {
                            // Update the x and y scale, using cos for x and sin for y
                            // and get the right speed by multiplying by the speed and delta time.
                            radian = Math.atan2(deltaY, deltaX);
                            currentScale.x += Math.cos(radian) * scaleSpeed * deltaT;
                            currentScale.y += Math.sin(radian) * scaleSpeed * deltaT;
                        }
                    }
                },
                draw: function (gameData) {
                    gameData.context.scale(currentScale.x, currentScale.y);
                },
                setScale: function (vec) {
                    currentScale.x = Sugar.isNumber(vec.x) ? vec.x : currentScale.x;
                    currentScale.y = Sugar.isNumber(vec.y) ? vec.y : currentScale.y;
                    targetScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    targetScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                    object.updateBoundingBox();
                },
                setTarget: function (vec) {
                    targetScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    targetScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                    atTarget = false;
                },
                setSpeed: function (value) {
                    scaleSpeed = Sugar.isNumber(value) ? value : scaleSpeed;
                    scaleSpeed = scaleSpeed / 100;
                },
                getScale: function () {
                    return currentScale;
                },
                getTarget: function () {
                    return targetScale;
                },
                getSpeed: function () {
                    return scaleSpeed * 100;
                },
                atTarget: function () {
                    return atTarget;
                },
                getDimension: function () {
                    var dimension;
                    if (Sugar.isDefined(object.animatable)) {
                        dimension = object.animatable.getDimension();
                    } else if (Sugar.isDefined(object.spritable)) {
                        dimension = object.getDimension();
                    } else {
                        dimension = Dimension(1, 1);
                    }
                    return Dimension(
                            dimension.width * currentScale.x,
                            dimension.height * currentScale.y
                        ); 
                },
                register: function () {
                    baseComponent.register('draw');
                    baseComponent.register('update');
                },
                unregister: function () {
                    baseComponent.unregister('draw');
                    baseComponent.unregister('update');
                }
            });

            return object;
        };
    }
);
