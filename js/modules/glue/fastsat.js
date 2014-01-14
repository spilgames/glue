/**
 *  @module SAT (Separating Axis Theorem)
 *  @desc Handles the collision between two rectangles.
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/fastsat',
    [
        'glue',
        'glue/math',
        'glue/math/vector',
        'glue/math/rectangle',
        'glue/math/dimension',
        'glue/game',
        'glue/spatial'
    ],
    function (Glue, Mathematics, Vector, Rectangle, Dimension, Game, Spatial) {
        'use strict';
        var Sugar = Glue.sugar,
            math = Mathematics(),
            spatial = Spatial(),
            check = [],
            module = {
                setup: function (config) {
                    spatial.setup({
                        gridDimension: Dimension(800, 600),
                        gridSize: 100
                    });
                    spatial.setDebug(true);
                },
                addObject: function (object) {
                    if (Sugar.isDefined(object.kineticable)) {
                        check.push(object);
                    }
                },
                checkOverlap: function (object) {
                    if (Sugar.isDefined(object.kineticable)) {
                        console.log(spatial.getNearbyObjects(object));
                    }
                },
                resetSpatial: function () {
                    spatial.clearObjects();
                    spatial.addArray(check);
                }
            };

        return module;
    }
);
