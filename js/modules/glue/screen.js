/**
 *  @module Screen
 *  @desc Directs a game screen
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/screen',
    [
        'glue',
        'glue/game'
    ],
    function (Glue, Game) {
        'use strict';
        var Sugar = Glue.sugar;

        return function (name) {
            var objects = [],
                isShown = false,
                module = {
                    /**
                     * Mixin object with new functionality
                     * @name add
                     * @memberOf screen
                     * @function
                     */
                    add: function (object) {
                        return Sugar.combine(this, object);
                    },
                    /**
                     * Add object to screen
                     * @name addObject
                     * @memberOf screen
                     * @function
                     */
                    addObject: function (object, callback) {
                        if (Sugar.isObject(object)) {
                            objects.push(object);
                            if (isShown) {
                                Game.add(object, function () {
                                    if (Sugar.isFunction(callback)) {
                                        callback();
                                    }
                                });
                            }
                        }
                    },
                    /**
                     * Removes object from screen
                     * @name removeObject
                     * @memberOf screen
                     * @function
                     */
                    removeObject: function (object, callback) {
                        var index;
                        if (Sugar.isObject(object)) {
                            index = objects.indexOf(object);
                            if (index >= 0) {
                                objects.splice(index, 1);
                                if (isShown) {
                                    Game.remove(object, callback);
                                }
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
                    },
                    /**
                     * Set a boolean that defines if the screen is shown
                     * @name setShown
                     * @memberOf screen
                     * @function
                     */
                    setShown: function (bool) {
                        if (!Sugar.isBoolean(bool)) {
                            throw 'Argument is not a boolean';
                        } else {
                            isShown = bool;
                        }
                    }
                };

            return module;
        };
    }
);
