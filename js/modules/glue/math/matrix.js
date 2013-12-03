/**
 *  @module Matrix
 *  @namespace math
 *  @desc Represents a matrix
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/matrix',
    function () {
        'use strict';
        return function (m, n, initial) {
            var mat = [],
                a,
                row,
                col;

            for (row = 0; row < m; ++row) {
                a = [];
                for (col = 0; col < n; ++col) {
                    a[col] = initial || 0;
                }
                mat[row] = a;
            }

            return {
                get: function () {
                    return mat;
                }
            };
        };
    }
);
