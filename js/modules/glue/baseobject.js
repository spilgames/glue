/*
 *  @module BaseObject
 *  @desc Represents a base object
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/baseobject',
    [
        'glue',
        'glue/math/vector',
        'glue/math/rectangle',
        'glue/math/dimension',
        'glue/math/matrix'
    ],
    function (Glue, Vector, Rectangle, Dimension, Matrix) {
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
                acceptedTypes = ['update', 'draw', 'pointerDown', 'pointerMove', 'pointerUp'],
                drawLast = ['animatable', 'spritable', 'spineable'],
                d,
                dLength = drawLast.length,
                drawRegistrant,
                registrants = {
                    destroy: {},
                    draw: {},
                    update: {},
                    pointerDown: {},
                    pointerMove: {},
                    pointerUp: {}
                },
                children = [],
                parent = null,
                uniqueID = ++crossInstanceID,
                callRegistrants = function (type, gameData) {
                    var registrant;
                    typeRegistrants = registrants[type];
                    for (registrant in typeRegistrants) {
                        if (type === 'draw' && Sugar.contains(drawLast, registrant)) {
                            continue;
                        }
                        typeRegistrants[registrant].call(module, gameData);
                    }
                },
                transformEvent = function (evt) {
                    // consideration: it might be too expensive to clone the event object
                    var e = Sugar.clone(evt),
                        positionVector = e.position.toMatrix(),
                        translateMatrix = Matrix(3, 3),
                        scaleMatrix = Matrix(3, 3),
                        rotateMatrix = Matrix(3, 3),
                        sin,
                        cos,
                        type;
                    
                    /** 
                    * reverse transformation
                    */
                    // construct a translation matrix and apply to position vector
                    translateMatrix.set(2, 0, -position.x);
                    translateMatrix.set(2, 1, -position.y);
                    positionVector.multiply(translateMatrix);
                    // only scale/rotatable if there is a component
                    for (type in registrants.draw) {
                        if (type === 'rotatable') {
                            // construct a rotation matrix and apply to position vector
                            sin = Math.sin(-module.rotatable.getAngleRadian());
                            cos = Math.cos(-module.rotatable.getAngleRadian());
                            rotateMatrix.set(0, 0, cos);
                            rotateMatrix.set(1, 0, -sin);
                            rotateMatrix.set(0, 1, sin);
                            rotateMatrix.set(1, 1, cos);
                            positionVector.multiply(rotateMatrix);
                        }
                        if (type === 'scalable') {
                            // construct a scaling matrix and apply to position vector
                            scaleMatrix.set(0, 0, 1 / module.scalable.getScale().x);
                            scaleMatrix.set(1, 1, 1 / module.scalable.getScale().y);
                            positionVector.multiply(scaleMatrix);
                        }
                    }

                    e.position.x = positionVector.get(0, 0); 
                    e.position.y = positionVector.get(0, 1);

                    // pass parent
                    e.parent = evt;
                    return e;  
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
                    update: function (gameData) {
                        var i,
                            l;
                        callRegistrants('update', gameData);
                        // update children
                        for (i = 0, l = children.length; i < l; ++i) {
                            children[i].update(gameData);                            
                        }
                    },
                    count: 0,
                    updateWhenPaused: false,
                    draw: function (gameData) {
                        var scroll = gameData.scroll || Vector(0, 0),
                            context = gameData.context,
                            i,
                            l;

                        context.save();
                        context.translate(
                            position.x - scroll.x,
                            position.y - scroll.y
                        );

                        // draws rotatable, scalable etc.
                        callRegistrants('draw', gameData);

                        // translate to origin
                        context.translate(-origin.x, -origin.y);

                        // draws animatable and spritable
                        for (d = 0; d < dLength; ++d) {
                            drawRegistrant = registrants.draw[drawLast[d]];
                            if (drawRegistrant) {
                                drawRegistrant(gameData);
                            }
                        }

                        // translate back from origin before drawing children
                        context.translate(origin.x, origin.y);
                        // draw children
                        for (i = 0, l = children.length; i < l; ++i) {
                            children[i].draw(gameData);                            
                        }
                        
                        context.restore();
                    },
                    pointerDown: function (e) {
                        var i,
                            l = children.length,
                            childEvent,
                            pos;

                        callRegistrants('pointerDown', e);

                        if (l) {
                            childEvent = transformEvent(e);
                            // pass through children
                            for (i = 0; i < l; ++i) {
                                children[i].pointerDown(childEvent);
                            }
                        }
                    },
                    pointerMove: function (e) {
                        var i,
                            l = children.length,
                            childEvent,
                            pos;

                        callRegistrants('pointerMove', e);

                        if (l) {
                            childEvent = transformEvent(e);
                            // pass through children
                            for (i = 0; i < l; ++i) {
                                children[i].pointerMove(childEvent);
                            }
                        }
                    },
                    pointerUp: function (e) {
                        var i,
                            l = children.length,
                            childEvent,
                            pos;

                        callRegistrants('pointerUp', e);

                        if (l) {
                            childEvent = transformEvent(e);
                            // pass through children
                            for (i = 0; i < l; ++i) {
                                children[i].pointerUp(childEvent);
                            }
                        }
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
                            this.updateBoundingBox();
                        }
                    },
                    setPositionObject: function (value) {
                        if (Sugar.isVector(value)) {
                            position = value;
                            this.updateBoundingBox();
                        }
                    },
                    getDimension: function () {
                        return dimension;
                    },
                    setDimension: function (value) {
                        if (Sugar.isDimension(value)) {
                            dimension = value;
                            this.updateBoundingBox();
                        }
                    },
                    getBoundingBox: function () {
                        return rectangle;
                    },
                    setBoundingBox: function (value) {
                        rectangle = value;
                    },
                    updateBoundingBox: function () {
                        var scale = module.scalable ? module.scalable.getScale() : Vector(1, 1),
                            x1 = position.x - origin.x * scale.x,
                            y1 = position.y - origin.y * scale.y,
                            x2 = position.x + (dimension.width - origin.x) * scale.x,
                            y2 = position.y + (dimension.height - origin.y) * scale.y;

                        // swap variables if scale is negative
                        if (scale.x < 0) {
                            x2 = [x1, x1 = x2][0];
                        }
                        if (scale.y < 0) {
                            y2 = [y1, y1 = y2][0];
                        }
                        rectangle = Rectangle(x1, y1, x2, y2);
                    },
                    setOrigin: function (value) {
                        if (Sugar.isVector(value)) {
                            origin.x = Sugar.isNumber(value.x) ? value.x : origin.x;
                            origin.y = Sugar.isNumber(value.y) ? value.y : origin.y;
                            this.updateBoundingBox();
                        }
                    },
                    getOrigin: function () {
                        return origin;
                    },
                    addChild: function (baseObject) {
                        children.push(baseObject);
                        baseObject.setParent(this);

                        if (baseObject.init) {
                            baseObject.init();
                        }
                    },
                    getChildren: function () {
                        return children;
                    },
                    setParent: function (obj) {
                        parent = obj;
                    },
                    getParent: function () {
                        return parent;
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
