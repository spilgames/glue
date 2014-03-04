/*
 *  @module Scalable
 *  @namespace component
 *  @desc Represents a scalable component
 *  @copyright (C) SpilGames
 *  @author Felipe Alfonso
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/scalable',
    [
        'glue',
        'glue/basecomponent',
        'glue/math/vector',
        'glue/math/dimension',
        'glue/math'
    ],
    function (Glue, BaseComponent, Vector, Dimension, Mathematics) {
        'use strict';
        var Sugar = Glue.sugar,
            math = Mathematics();

        return function (object) {
            var baseComponent = BaseComponent('scalable', object),
                currentScale = Vector(1, 1),
                targetScale = Vector(1, 1),
                lastScale = Vector(1, 1),
                scaleSpeed = 0.05, // Scale speed should be between 0 and 1
                scaleValue = 1,
                atTarget = true;

            baseComponent.set({
                update: function (deltaT) {
                    if (!atTarget) {
                        currentScale.x = math.lerp(scaleValue, lastScale.x, targetScale.x);
                        currentScale.y = math.lerp(scaleValue, lastScale.y, targetScale.y);
                        if (scaleValue >= 1) {
                            atTarget = true;
                            this.scalable.setScale(targetScale);
                        }
                        scaleValue += scaleSpeed;
                    }
                },
                draw: function (deltaT, context) {
                    context.scale(currentScale.x, currentScale.y);
                },
                setScale: function (vec) {
                    currentScale.x = Sugar.isNumber(vec.x) ? vec.x : currentScale.x;
                    currentScale.y = Sugar.isNumber(vec.y) ? vec.y : currentScale.y;
                    targetScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    targetScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                    lastScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    lastScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                    scaleValue = 1;
                },
                setTarget: function (vec) {
                    targetScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    targetScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                    atTarget = false;
                    scaleValue = 0;
                },
                setSpeed: function (value) {
                    scaleSpeed = Sugar.isNumber(value) ? value : scaleSpeed;
                },
                getScale: function () {
                    return currentScale;
                },
                getTarget: function () {
                    return targetScale;
                },
                getSpeed: function () {
                    return scaleSpeed;
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
                }
            });

            baseComponent.register('update');
            baseComponent.register('draw');

            return object;
        };
    }
);
