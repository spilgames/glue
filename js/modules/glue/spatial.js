/**
 *  @module Spatial
 *  @desc Checks if collision is needed using a spatial matrix
 *  @copyright (C) SpilGames
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
                        position = object.spritable.getPosition(),
                        dimension = object.spritable.getDimension(),
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
                resetGrid = function () {
                    var gridCount,
                        i = 0;

                    spatialGrid = {};
                    gridCount = 
                        (gridDimension.width / gridSize) * 
                        (gridDimension.height / gridSize);
                    for (i; i < gridCount; ++i) {
                        spatialGrid[i] = [];
                    }
                },
                module = {
                    setup: function (config) {
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
                        resetGrid();
                    },
                    setDebug: function (value) {
                        if (value === true) {
                            Game.add(module);
                        }
                        if (value === false) {
                            Game.remove(module);
                        }
                    },
                    clearObjects: function () {
                        resetGrid();
                    },
                    addObject: function (object) {
                        var inCells = getObjectCells(object),
                            i = 0,
                            l = inCells.length;
                        for (i; i < l; ++i) {
                            spatialGrid[inCells[i]].push(object);
                        }
                    },
                    addArray: function (array) {
                        var i,
                            len;
                        for (i = 0, len = array.length; i < len; ++i) {
                            module.addObject(array[i]);
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
                    handleNearbyObjects: function (obj, func) {
                        var list,
                            i,
                            len,
                            j,
                            jlen;
                        if (Sugar.isFunction(func)) {
                            list = module.getNearbyObjects(obj);
                            for (i = 0, len = list.length; i < len; ++i) {
                                if (list[i]) {
                                    for (j = 0, jlen = list[i].length; j < jlen; ++j) {
                                        if (list[i].indexOf(obj) !== j) {
                                            func(list[i][j]);
                                        }
                                    }
                                }
                            }
                        }
                    },
                    draw: function (deltaT, context) {
                        var x = 0,
                            y = 0;

                        context.save();
                        context.beginPath();
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
                        context.closePath();
                        context.restore();
                    }
                };

            return module;
        }
    }
);
