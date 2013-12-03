/**
 *  @module Dimension
 *  @namespace math
 *  @desc Represents a dimension
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/math/dimension',
    function () {
        'use strict';
        return function (width, height, depth) {
            var dimension = {
                width: width,
                height: height,
                depth: depth || 0
            };
            return {
                width: dimension.width,
                height: dimension.height,
                depth: dimension.depth,
                get: function () {
                    return dimension;
                }
            };
        };
    }
);
