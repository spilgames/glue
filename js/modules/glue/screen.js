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
            var objects = [],
                module = {
                    /**
                     * Add object to screen
                     * @name addObject
                     * @memberOf screen
                     * @function
                     */
                    addObject: function (object) {
                        if (Sugar.isObject(object)) {
                            objects.push(object);
                        }
                    },
                    /**
                     * Removes object from screen
                     * @name removeObject
                     * @memberOf screen
                     * @function
                     */
                    removeObject: function (object) {
                        var index;
                        if (Sugar.isObject(object)) {
                            index = objects.indexOf(object);
                            if (index >= 0) {
                                objects.splice(index, 1);
                            }
                        }
                    },
                    /**
                     * Gets the object array
                     * @name getObjects
                     * @memberOf screen
                     * @function
                     * @return Array of added objects
                     */
                    getObjects: function () {
                        return objects;
                    },
                    /**
                     * Get the name of the screen
                     * @name getName
                     * @memberOf screen
                     * @function
                     * @return Screen name as string
                     */
                    getName: function () {
                        return name;
                    }
                };

            return module;
        };
    }
);
