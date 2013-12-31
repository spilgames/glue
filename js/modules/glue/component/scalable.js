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
                scaleSpeed = 100,
                equals = function (vec1, vec2) {
                    return vec1.x === vec2.x && vec1.y === vec2.y;
                };

            component = component || {};
            component.scalable = {
                update: function (deltaT) {
                    if (!equals(currentScale, targetScale)) {

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
                setScaleTarget: function (vec) {
                    targetScale.x = Sugar.isNumber(vec.x) ? vec.x : targetScale.x;
                    targetScale.y = Sugar.isNumber(vec.y) ? vec.y : targetScale.y;
                },
                setScaleSpeed: function (value) {
                    scaleSpeed = Sugar.isNumber(value) ? value : scaleSpeed;
                },
                setOrigin: function (vec) {
                    origin.x = Sugar.isNumber(vec.x) ? vec.x : origin.x;
                    origin.y = Sugar.isNumber(vec.y) ? vec.y : origin.y;
                },
                getScale: function () {
                    return currentScale;
                },
                getScaleTarget: function () {
                    return targetScale;
                },
                getScaleSpeed: function () {
                    return scaleSpeed;
                },
                getOrigin: function () {
                    return origin;
                }
            };
            return component;
        };
    }
);
