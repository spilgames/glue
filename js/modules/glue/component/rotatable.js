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
                origin = Vector(0, 0);
            obj = obj || {};
            obj.rotatable = {
                draw: function (deltaT, context) {
                    context.translate(origin.x, origin.y);
                    context.rotate(angle);
                    context.translate(-origin.x, -origin.y);
                },
                setAngleDegree: function (value) {
                    angle = Sugar.isNumber(value) ? value : angle;
                    angle *= Math.PI / 180;
                },
                setAngleRadian: function (value) {
                    angle = Sugar.isNumber(value) ? value : angle;
                },
                setOrigin: function (vec) {
                    origin.x = Sugar.isNumber(vec.x) ? vec.x : origin.x;
                    origin.y = Sugar.isNumber(vec.y) ? vec.y : origin.y;
                },
                getAngleDegree: function () {
                    return angle * 180 / Math.PI;
                },
                getAngleRadian: function () {
                    return angle;
                },
                getOrigin: function () {
                    return origin;
                }
            };
            return obj;
        };
    }
);
