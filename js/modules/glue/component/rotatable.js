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
            var angle = 0,
                handle = Vector(0, 0);
            obj = obj || {};
            obj.rotatable = {
                draw: function (deltaT, context) {
                    context.translate(handle.x, handle.y);
                    context.rotate(angle);
                    context.translate(-handle.x, -handle.y);
                },
                setAngleDegree: function (value) {
                    angle = value && !isNaN(value) ? value : angle;
                    angle *= Math.PI / 180;
                },
                setAngleRadian: function (value) {
                    angle = !isNaN(value) ? value : angle;
                },
                setHandle: function (vec) {
                    handle.x = !isNaN(vec.x) ? vec.x : handle.x;
                    handle.y = !isNaN(vec.y) ? vec.y : handle.y;
                },
                getAngleDegree: function () {
                    return angle * 180 / Math.PI;
                },
                getAngleRadian: function () {
                    return angle;
                },
                getHandle: function () {
                    return handle;
                }
            };
            return obj;
        };
    }
);
