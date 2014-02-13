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
        'glue',
        'glue/math/vector',
        'glue/math/rectangle',
        'glue/math/dimension'
    ],
    function (Glue, Vector, Rectangle, Dimension) {
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
                position = Vector(0, 0),
                origin = Vector(0, 0),
                dimension = Dimension(0, 0),
                rectangle = Rectangle(0, 0, 0, 0),
                l = mixins.length,
                i = 0,
                j = 0,
                typeRegistrants,
                typeRegistrantsLength,
                typeRegistrant,
                acceptedTypes = ['init', 'update', 'draw', 'pointerDown', 'pointerMove', 'pointerUp'],
                registrants = {
                    init: {},
                    draw: {},
                    update: {},
                    pointerDown: {},
                    pointerMove: {},
                    pointerUp: {}
                },
                callRegistrants = function (type, parameters) {
                    parameters = Array.prototype.slice.call(parameters);
                    typeRegistrants = registrants[type];
                    for (registrant in typeRegistrants) {
                        typeRegistrants[registrant].apply(module, parameters);
                    }
                },
                updateRectangle = function () {
                    var scale = Vector(1, 1);
                    if (module.scalable) {
                        scale = module.scalable.getScale();
                    }
                    rectangle.x1 = position.x - origin.x * Math.abs(scale.x);
                    rectangle.y1 = position.y - origin.y * Math.abs(scale.y);
                    rectangle.x2 = position.x - origin.x * Math.abs(scale.x) + dimension.width;
                    rectangle.y2 = position.y - origin.y * Math.abs(scale.y) + dimension.height;
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
                    scroll = scroll || Vector(0, 0);
                    context.save();
                    context.translate(
                        position.x - scroll.x,
                        position.y - scroll.y
                    );
                    if (registrants.draw.scalable) {
                        registrants.draw.scalable(deltaT, context, scroll);
                    }
                    if (registrants.draw.rotatable) {
                        registrants.draw.rotatable(deltaT, context, scroll);
                    }
                    if (registrants.draw.fadable) {
                        registrants.draw.fadable(deltaT, context, scroll);
                    }

                    context.translate(-origin.x, -origin.y);
                    if (registrants.draw.visible) {
                        registrants.draw.visible(deltaT, context, scroll);
                    }
                    context.restore();
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
                register: function (type, registrant, name) {
                    if (Sugar.contains(acceptedTypes, type) && Sugar.isFunction(registrant)) {
                        registrants[type][name] = registrant;
                    }
                },
                getPosition: function () {
                    return position;
                },
                setPosition: function (value) {
                    if (Sugar.isVector(value)) {
                        position.x = value.x;
                        position.y = value.y;
                        updateRectangle();
                    }
                },
                getDimension: function () {
                    return dimension;
                },
                setDimension: function (value) {
                    if (Sugar.isDimension(value)) {
                        dimension = value;
                        updateRectangle();
                    }
                },
                getBoundingBox: function () {
                    return rectangle;
                },
                setBoundingBox: function (value) {
                    rectangle = value;
                },
                setOrigin: function (value) {
                    if (Sugar.isVector(value)) {
                        origin.x = Sugar.isNumber(value.x) ? value.x : origin.x;
                        origin.y = Sugar.isNumber(value.y) ? value.y : origin.y;
                    }
                },
                getOrigin: function () {
                    return origin;
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
