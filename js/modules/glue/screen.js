/**
 *  @module Screen
 *  @desc Directs a game screen
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/screen',
    [
        'glue'
    ],
    function (Glue) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (name) {
            var useCache = true,
                objects = [],
                module = {
                    addObject: function (object) {
                        if (Sugar.isObject(object)) {
                            objects.push(object);
                        }
                    },
                    getObjects: function () {
                        return objects;
                    },
                    getName: function () {
                        return name;
                    },
                    useCache: function () {
                        return useCache;
                    },
                    setUseCache: function (value) {
                        if (Sugar.isBoolean(value)) {
                            useCache = value;
                        }
                    }
                };
            return module;
        };
    }
);
