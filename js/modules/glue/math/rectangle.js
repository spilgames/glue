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
                    this.x1 = Math.min(this.x1, rectangle.get().x1);
                    this.y1 = Math.min(this.y1, rectangle.get().y1);
                    this.x2 = Math.max(this.x2, rectangle.get().x2);
                    this.y2 = Math.max(this.y2, rectangle.get().y2);
                }
            };
        };
    }
);
