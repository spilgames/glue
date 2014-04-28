/**
 *  @module Rectangle
 *  @namespace math
 *  @desc Represents a rectangle
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/rectangle',
    function () {
        'use strict';
        return function (x1, y1, x2, y2) {
            return {
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                get: function () {
                    return {
                        x1: this.x1,
                        y1: this.y1,
                        x2: this.x2,
                        y2: this.y2
                    };
                },
                hasPosition: function (position) {
                    if (position.x >= this.x1 && position.x <= this.x2 &&
                        position.y >= this.y1 && position.y <= this.y2) {
                        return true;
                    }
                },
                getWidth: function () {
                    return this.x2 - this.x1;
                },
                getHeight: function () {
                    return this.y2 - this.y1;
                },
                setWidth: function (width) {
                    this.x2 = this.x1 + width;
                },
                setHeight: function (height) {
                    this.y2 = this.y1 + height;
                },
                union: function (rectangle) {
                    this.x1 = Math.min(this.x1, rectangle.x1);
                    this.y1 = Math.min(this.y1, rectangle.y1);
                    this.x2 = Math.max(this.x2, rectangle.x2);
                    this.y2 = Math.max(this.y2, rectangle.y2);
                },
                intersect: function (rectangle) {
                    return this.x2 > rectangle.x1 &&
                           this.x1 < rectangle.x2 &&
                           this.y2 > rectangle.y1 &&
                           this.y1 < rectangle.y2;
                },
                intersection: function (rectangle) {
                    var inter = {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0
                    };
                    if (this.intersect(rectangle)) {
                        inter.x1 = Math.max(this.x1, rectangle.x1);
                        inter.y1 = Math.max(this.y1, rectangle.y1);
                        inter.x2 = Math.min(this.x1 + this.x2, rectangle.x1 + rectangle.x2) - inter.x1;
                        inter.y2 = Math.min(this.y1 + this.y2, rectangle.y1 + rectangle.y2) - inter.y1;
                    }
                    return inter;
                }
            };
        };
    }
);
