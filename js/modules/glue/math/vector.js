/**
 *  @module Vector
 *  @namespace math
 *  @desc Represents a vector
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/vector', [
        'glue/math'
    ],
    function (Mathematics) {
        'use strict';
        var module = function (x, y, z) {
            var math = Mathematics();

            return {
                x: x,
                y: y,
                get: function () {
                    return {
                        x: this.x,
                        y: this.y
                    }
                },
                add: function (vector) {
                    this.x += vector.x;
                    this.y += vector.y;
                    return this;
                },
                substract: function (vector) {
                    this.x -= vector.x;
                    this.y -= vector.y;
                    return this;
                },
                angle: function (vector) {
                    return Math.atan2(
                        (vector.y - this.y), (vector.x - this.x)
                    );
                },
                dotProduct: function (vector) {
                    return this.x * vector.x + this.y * vector.y;
                },
                distance: function (vector) {
                    return Math.sqrt(
                        (this.x - vector.x) * (this.x - vector.x) +
                        (this.y - vector.y) * (this.y - vector.y)
                    );
                },
                multiply: function (vector) {
                    this.x *= vector.x;
                    this.y *= vector.y;
                    return this;
                },
                scale: function (value) {
                    this.x *= value;
                    this.y *= value;
                    return this;
                },
                length: function () {
                    return Math.sqrt(math.square(this.x) + math.square(this.y));
                },
                normalize: function (value) {
                    this.x /= value > 0 ? value : 1;
                    this.y /= value > 0 ? value : 1;
                    return this;
                },
                copy: function (vector) {
                    this.x = vector.x;
                    this.y = vector.y;
                    return this;
                },
                clone: function () {
                    return module(this.x, this.y);
                },
                toMatrix: function () {
                        var matrix = math.Matrix(1, 3);
                        matrix.set(0, 0, this.x);
                        matrix.set(0, 1, this.y);
                        matrix.set(0, 2, 1);
                        return matrix;
                },
                static: {
                    add: function (vector1, vector2) {
                        var vector = vector1.clone();
                        vector.add(vector2);
                        return vector;
                    },
                    substract: function (vector1, vector2) {
                        var vector = vector1.clone();
                        vector.substract(vector2);
                        return vector;
                    },
                    angle: function (vector1, vector2) {
                        return vector1.angle(vector2);
                    },
                    dotProduct: function (vector1, vector2) {
                        return vector1.dotProduct(vector2);
                    },
                    distance: function (vector1, vector2) {
                        return vector1.distance(vector2);
                    },
                    multiply: function (vector1, vector2) {
                        var vector = vector1.clone();
                        vector.multiply(vector2);
                        return vector;
                    },
                    scale: function (vector1, value) {
                        var vector = vector1.clone();
                        vector.scale(value);
                        return vector;
                    },
                    length: function (vector1) {
                        var vector = vector1.clone();
                        return vector.length();
                    },
                    normalize: function (vector1, value) {
                        var vector = vector1.clone();
                        vector.normalize(value);
                        return vector;
                    },
                    copy: function (vector1, vector2) {
                        var vector = vector1.clone();
                        vector.copy(vector2);
                        return vector;
                    },
                    clone: function (vector1) {
                        return vector1.clone();
                    }
                }
            };
        };
        return module;
    }
);