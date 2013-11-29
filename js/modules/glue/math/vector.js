/**
 *  @module Vector
 *  @namespace math
 *  @desc Represents a vector
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/vector',
    function () {
        'use strict';
        var coordinates;
        return function (x, y, z) {
            coordinates = {
                x: x,
                y: y,
                z: z || 0
            };
            return {
                get: function () {
                    return coordinates;
                }
            };
        };
    }
);
