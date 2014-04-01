/**
 *  @module Array2D
 *  @namespace math
 *  @desc Represents a 2D array
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/array2d', [
        'glue'
    ],
    function (
        Glue
    ) {
        'use strict';
        var sugar = Glue.sugar;
        return function (x, y, initial) {
            var mat = [],
                a,
                col,
                row;

            for (col = 0; col < x; ++col) {
                a = [];
                for (row = 0; row < y; ++row) {
                    a[row] = initial || null;
                }
                mat[col] = a;
            }

            return {
                get: function () {
                    return mat;
                },
                getValue: function (col, row) {
                    if (mat[col] !== undefined && mat[col][row] !== undefined) {
                        return mat[col][row];
                    }
                },
                iterate: function (callback) {
                    for (col = 0; col < x; ++col) {
                        for (row = 0; row < y; ++row) {
                            if (!sugar.isFunction(callback)) {
                                throw('Please supply a callback function');
                            }
                            callback(col, row, mat[col][row]);
                        }
                    }
                },
                set: function (col, row, value) {
                    if (mat[col] !== undefined && mat[col][row] !== undefined) {
                        mat[col][row] = value;
                    }
                },
                unset: function (col, row) {
                    if (mat[col] !== undefined && mat[col][row] !== undefined) {
                        mat[col][row] = null;
                    }
                }
            };
        };
    }
);
