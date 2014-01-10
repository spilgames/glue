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
        'glue',
        'glue/math/rectangle',
        'glue/math/dimension',
        'glue/math/matrix',
        'glue/math/vector'
    ],
    function (Glue, Rectangle, Dimension, Matrix, Vector) {
        'use strict';
        return function () {
            var Sugar = Glue.sugar;
            return {
                Dimension: Dimension,
                Matrix: Matrix,
                Vector: Vector,
                random: function (min, max) {
                    return ~~(Math.random() * (max - min + 1)) + min;
                },
                square: function (x) {
                    return x * x;
                },
                sign: function (x) {
                    if (Sugar.isNumber(x)) {
                        if (x > 0) {
                            return 1;
                        } else if (x < 0) {
                            return -1;
                        } else if(x === 0) {
                            return 0;
                        }
                    }
                },
                getHalfRectangle: function (rectangle) {
                    var tempRect = Rectangle(
                            rectangle.x1 + (rectangle.x2 / 2),
                            rectangle.y1 + (rectangle.y2 / 2),
                            rectangle.x2 / 2,
                            rectangle.y2 / 2
                        );
                    return tempRect;
                }
            };
        };
    }
);
