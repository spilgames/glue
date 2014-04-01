/*
 *  @module Circle
 *  @namespace math
 *  @desc Represents a Circle
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */

glue.module.create(
    'glue/math/circle',
    [
        'glue'
    ],
    function (Glue) {
        var Sugar = Glue.sugar,
            module = function (x, y, radius) {
            return {
                x: x || 0,
                y: y || 0,
                radius: radius || 0,
                addVector: function (vector) {
                    if (Sugar.isVector(vector)) {
                        this.x += vector.x;
                        this.y += vector.y;
                    } else {
                        throw 'The argument should be a Vector';
                    }
                },
                substractVector: function (vector) {
                    if (Sugar.isVector(vector)) {
                        this.x -= vector.x;
                        this.y -= vector.y;
                    } else {
                        throw 'The argument should be a Vector';
                    }
                },
                clone: function () {
                    return module(this.x, this.y, this.radius);
                }
            };
        };
        return module;
    }
);