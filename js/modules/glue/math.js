/**
 *  @module Math
 *  @desc The math module
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math',
    [
        'glue/math/dimension',
        'glue/math/matrix',
        'glue/math/vector'
    ],
    function (Dimension, Matrix, Vector) {
        'use strict';
        return function () {
            return {
                Dimension: Dimension,
                Matrix: Matrix,
                Vector: Vector
            };
        };
    }
);
