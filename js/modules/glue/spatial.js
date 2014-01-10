/**
 *  @module Spatial
 *  @desc Checks if collision is needed using a spatial matrix
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/spatial',
    [
        'glue',
        'glue/game',
        'glue/math',
        'glue/math/vector',
        'glue/math/dimension'
    ],
    function (
        Glue,
        Game,
        Mathematics,
        Vector,
        Dimension
    ) {
        'use strict';
        return function () {
            var Sugar = Glue.sugar,
                math = Mathematics(),
                debug = false,
                gridDimension,
                gridSize,
                spatialGrid,
                addCell = function (position, cells) {
                    var gridPosition = parseInt(
                           (Math.floor(position.x / gridSize)) +
                           (Math.floor(position.y / gridSize)) *
                           (gridDimension.width / gridSize) 
                        );

                    if (!Sugar.contains(cells, gridPosition)) {
                        cells.push(gridPosition);
                    }
                },
                getObjectCells = function (object) {
                    var cells = [],
                        position = object.visible.getPosition(),
                        dimension = object.visible.getDimension(),
                        min = Vector(
                            position.x,
                            position.y
                        ),
                        max = Vector(
                            position.x + dimension.width,
                            position.y + dimension.height
                        );

                    // top left
                    addCell(Vector(min.x, min.y), cells);
                    // top right
                    addCell(Vector(max.x, min.y), cells);
                    // bottom right
                    addCell(Vector(max.x, max.y), cells);
                    // bottom left
                    addCell(Vector(min.x, max.y), cells);

                    return cells;
                },
                module = {
                    setup: function (config) {
                        var gridCount,
                            i = 0;

                        config = config || {};
                        if (Sugar.isDefined(config.gridDimension)) {
                            gridDimension = config.gridDimension;
                        } else {
                            gridDimension = Game.canvas.getDimension();
                        }
                        if (Sugar.isDefined(config.gridSize)) {
                            gridSize = config.gridSize;
                        } else {
                            gridSize = gridDimension.height / 3;
                        }
                        spatialGrid = {};
                        gridCount = 
                            (gridDimension.width / gridSize) * 
                            (gridDimension.height / gridSize);
                        for (i; i < gridCount; ++i) {
                            spatialGrid[i] = [];
                        }
                    },
                    setDebug: function (value) {
                        if (value === true) {
                            Game.add(module);
                        }
                    },
                    addObject: function (object) {
                        var inCells = getObjectCells(object),
                            i = 0,
                            l = inCells.length;

                        for (i; i < l; ++i) {
                            spatialGrid[inCells[i]].push(object);
                        }
                    },
                    getNearbyObjects: function (object) {
                        var nearby = [],
                            inCells = getObjectCells(object),
                            i = 0,
                            l = inCells.length;

                        for (i; i < l; ++i) {
                            nearby.push(spatialGrid[inCells[i]]);
                        }
                        return nearby;
                    },
                    draw: function (deltaT, context) {
                        var x = 0,
                            y = 0;

                        context.save();
                        for (x; x <= gridDimension.width; x += gridSize) {
                            context.moveTo(x, 0);
                            context.lineTo(x, gridDimension.height);
                        }
                        for (y; y <= gridDimension.height; y += gridSize) {
                            context.moveTo(0, y);
                            context.lineTo(gridDimension.width, y);
                        }
                        context.strokeStyle = 'black';
                        context.stroke();
                        context.restore();
                    }
                };

            return module;
        }
    }
);
