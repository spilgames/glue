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
        var Sugar = Glue.sugar,
            crossInstanceID = 0;
        return function () {
            var name,
                mixins = Array.prototype.slice.call(arguments),
                mixin = null,
                position = Vector(0, 0),
                origin = Vector(0, 0),
                dimension = Dimension(0, 0),
                rectangle,
                l = mixins.length,
                i = 0,
                j = 0,
                typeRegistrants,
                typeRegistrantsLength,
                typeRegistrant,
                acceptedTypes = ['init', 'update', 'draw', 'pointerDown', 'pointerMove', 'pointerUp'],
                drawLast = ['animatable', 'spritable', 'spineable', 'base'],
                d,
                dLength = drawLast.length,
                drawRegistrant,
                registrants = {
                    init: {},
                    draw: {},
                    update: {},
                    pointerDown: {},
                    pointerMove: {},
                    pointerUp: {}
                },
                children = {},
                parent = null,
                uniqueID = ++crossInstanceID,
                callRegistrants = function (type, parameters) {
                    parameters = Array.prototype.slice.call(parameters);
                    typeRegistrants = registrants[type];
                    for (registrant in typeRegistrants) {
                        if (type === 'draw' && Sugar.contains(drawLast, registrant)) {
                            continue;
                        }
                        typeRegistrants[registrant].apply(module, parameters);
                    }
                },
                updateRectangle = function () {
                    var scale = Vector(1, 1);
                    if (module.scalable) {
                        scale = module.scalable.getScale();
                    }
                    rectangle = Rectangle(
                        position.x - origin.x * Math.abs(scale.x),
                        position.y - origin.y * Math.abs(scale.y),
                        position.x - origin.x * Math.abs(scale.x) + dimension.width,
                        position.y - origin.y * Math.abs(scale.y) + dimension.height
                    );
                },
                module = {
                    add: function (object) {
                        return Sugar.combine(this, object);
                    },
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

                        // draws rotatable, scalable etc.
                        callRegistrants('draw', arguments);

                        // translate to origin
                        context.translate(-origin.x, -origin.y);

                        // draws animatable and spritable
                        for (d = 0; d < dLength; ++d) {
                            drawRegistrant = registrants.draw[drawLast[d]];
                            if (drawRegistrant) {
                                drawRegistrant(deltaT, context, scroll);
                            }
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
                    unregister: function (type, name) {
                        if (Sugar.contains(acceptedTypes, type) &&
                            Sugar.isFunction(registrants[type][name])) {
                            delete registrants[type][name];
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
                            updateRectangle();
                        }
                    },
                    getOrigin: function () {
                        return origin;
                    },
                    addChild: function (baseObject, id) {
                        if (Sugar.isDefined(id)) {
                            children[id] = baseObject;
                        } else if (Sugar.isDefined(baseObject.getName())) {
                            children[baseObject.getName()] = baseObject;
                        } else {
                            children[baseObject.getID()] = baseObject;
                        }
                        baseObject.setParent(this);

                        if (baseObject.init) {
                            baseObject.init();
                        }
                        if (baseObject.draw) {
                            module.register('draw', baseObject.draw, 'base');
                        }
                        if (baseObject.update) {
                            module.register('update', baseObject.update, 'base');
                        }
                    },
                    getChild: function (id) {
                        return children[id];
                    },
                    setParent: function (obj) {
                        parent = obj;
                    },
                    getParent: function (obj) {
                        return parent = obj;
                    },
                    getID: function () {
                        return uniqueID;
                    }
                };

            for (i; i < l; ++i) {
                mixin = mixins[i];
                mixin(module);
            }
            return module;
        };
    }
);
