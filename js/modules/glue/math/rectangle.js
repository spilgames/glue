/**
 *  @module Rectangle
 *  @namespace math
 *  @desc Represents a rectangle
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/rectangle',
    function () {
        'use strict';
        return function (x1, y1, x2, y2) {
            var rectangle = {
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2
            };
            return {
                x1: rectangle.x1,
                y1: rectangle.y1,
                x2: rectangle.x2,
                y2: rectangle.y2,
                get: function () {
                    return rectangle;
                }
            };
        };
    }
);
