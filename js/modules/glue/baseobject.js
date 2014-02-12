/*
 *  @module BaseObject
 *  @desc Represents a base object
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/baseobject',
    [
        'glue'
    ],
    function (Glue) {
        var Sugar = Glue.sugar;
        return function () {
            var name = '',
                module = {
                    add: function (object) {
                        return Sugar.combine(this, object);
                    }
                },
                mixins = Array.prototype.slice.call(arguments),
                mixin = null,
                l = mixins.length,
                i = 0,
                j = 0,
                typeRegistrants,
                typeRegistrantsLength,
                typeRegistrant,
                acceptedTypes = ['init', 'update', 'draw', 'pointerDown', 'pointerMove', 'pointerUp'],
                registrants = {
                    init: [],
                    draw: [],
                    update: [],
                    pointerDown: [],
                    pointerMove: [],
                    pointerUp: []
                },
                callRegistrants = function (type, parameters) {
                    parameters = Array.prototype.slice.call(parameters);
                    typeRegistrants = registrants[type];
                    typeRegistrantsLength = typeRegistrants.length;
                    for (j = 0; j < typeRegistrantsLength; ++j) {
                        typeRegistrants[j].apply(module, parameters);
                    }
                };

            module = Sugar.combine(module, {
                setName: function (value) {
                    name = value;
                },
                getName: function (value) {
                    return name;
                },
                init: function () {
                    callRegistrants('init', arguments);
                },
                update: function (deltaT) {
                    callRegistrants('update', arguments);                  
                },
                draw: function (deltaT, context, scroll) {
                    callRegistrants('draw', arguments);
                },
                pointerDown: function (e) {
                    callRegistrants('pointerDown', arguments);
                },
                pointerMove: function (e) {
                    callRegistrants('pointerMove', arguments);
                },
                pointerUp: function (e) {
                    callRegistrants('pointerUp', arguments);
                },
                register: function (type, callback) {
                    if (Sugar.contains(acceptedTypes, type) && Sugar.isFunction(callback)) {
                        registrants[type].push(callback);
                    }
                }
            });
            for (i; i < l; ++i) {
                mixin = mixins[i];
                mixin(module);
            }
            return module;
        };
    }
);
