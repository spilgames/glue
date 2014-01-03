/**
 *  @module Polygon
 *  @namespace math
 *  @desc Represents a polygon
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/polygon',
    function () {
        'use strict';
        return function (points) {
            return {
                get: function () {
                    return points;
                },
                hasPosition: function (p) {
                    var has = false,
                        minX = points[0].x, maxX = points[0].x,
                        minY = points[0].y, maxY = points[0].y,
                        n = 1,
                        q,
                        i = 0,
                        j = points.length - 1;

                    for (n = 1; n < points.length; ++n) {
                        q = points[n];
                        minX = Math.min(q.x, minX);
                        maxX = Math.max(q.x, maxX);
                        minY = Math.min(q.y, minY);
                        maxY = Math.max(q.y, maxY);
                    }
                    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
                        return false;
                    }
                    for (i, j; i < points.length; j = i++) {
                        if ((points[i].y > p.y) != (points[j].y > p.y) &&
                                p.x < (points[j].x - points[i].x) * (p.y - points[i].y) /
                                    (points[j].y - points[i].y) + points[i].x) {
                            has = !has;
                        }
                    }
                    return has;
                }
            };
        };
    }
);
