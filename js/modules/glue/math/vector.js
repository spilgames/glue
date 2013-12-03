/**
 *  @module Vector
 *  @namespace math
 *  @desc Represents a vector
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/vector', function () {
    'use strict';
    return function (x, y, z) {
        return {
            x: x,
            y: y,
            z: z || 0,
            get: function () {
                return {
                    x: this.x,
                    y: this.y,
                    z: this.z
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
                    (vector.y - this.y),
                    (vector.x - this.x)
                );
            },
            dotProduct: function (vector) {
                return this.x * vector.x + this.y * vector.y;
            },        
            distance : function (vector) {
                return Math.sqrt(
                    (this.x - vector.x) * (this.x - vector.x) +
                    (this.y - vector.y) * (this.y - vector.y)
                );
            }
        };
    };
});
