/*
 *  @module Draggable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity draggable
 *  @copyright (C) 2013 Jeroen Reurings, SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/modules/spilgames/entity/behaviour/draggable',
    [
        'glue'
    ],
    function (Glue) {
        // - cross instance private members -
        var highestEntity = null,
            maxZ = 2,
            customResetPosition,
            resetCallback,
            resetType;

        /**
         * Constructor
         * @name init
         * @memberOf Draggable
         * @function
         * @param {Object} obj: the entity object
         */
        return function (obj) {
            // - per instance private members -
            var position = {
                    x: obj.pos.x,
                    y: obj.pos.y
                },
                dropped = false,
                resetted = false,
                dragging = false,
                dragId = null,
                grabOffset = new Glue.math.vector(0, 0),
                mouseDown = null,
                mouseUp = null,
                pointerId = null,
                /**
                 * Is used to reset the draggable to its initial position
                 * @name reset
                 * @memberOf Draggable
                 * @function
                 */
                resetMe = function () {
                    switch (resetType) {
                        case obj.RESET_TYPE_X:
                            obj.pos.x = position.x;
                        break;
                        case obj.RESET_TYPE_Y:
                            obj.pos.y = position.y;
                        break;
                        case obj.RESET_TYPE_CUSTOM:
                            obj.pos.x = customResetPosition.x || obj.pos.x;
                            obj.pos.y = customResetPosition.y || obj.pos.y;
                        break;
                        case obj.RESET_TYPE_CALLBACK:
                            resetCallback.apply(obj);
                        break;
                        default:
                            obj.pos.x = position.x;
                            obj.pos.y = position.y;
                        break;
                    }
                },
                /**
                 * Gets called when the user starts dragging the entity
                 * @name dragStart
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragStart = function (e, draggable) {
                    if (draggable === obj) {
                        dropped = false;
                        resetted = false;
                        // depth sorting
                        if (highestEntity === null) {
                            highestEntity = obj;
                        } else {
                            if (obj.z > highestEntity.z) {
                                highestEntity = obj;
                            }
                        }
                        if (dragging === false && obj === highestEntity) {
                            // clicked entity goes on top
                            obj.z = maxZ + 1;
                            // save max z index of all draggables
                            maxZ = obj.z;
                            // re-sort all game entities
                            me.game.world.sort();
                            dragging = true;
                            dragId = e.pointerId;
                            grabOffset.set(e.gameX, e.gameY);
                            grabOffset.sub(obj.pos);
                            if (obj.dragStart) {
                                obj.dragStart(e);
                            }
                            return false;
                        }
                    }
                },
                /**
                 * Gets called when the user drags this entity around
                 * @name dragMove
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragMove = function (e) {
                    if (dragging === true) {
                        if (dragId === e.pointerId) {
                            obj.pos.set(e.gameX, e.gameY);
                            obj.pos.sub(grabOffset);
                            if (obj.dragMove) {
                                obj.dragMove(e);
                            }
                        }
                    }
                },
                /**
                 * Gets called when the user stops dragging the entity
                 * @name dragEnd
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragEnd = function (e, draggable) {
                    if (draggable === obj) {
                        highestEntity = null;
                        if (dragging === true) {
                            pointerId = undefined;
                            dragging = false;
                            if (obj.dragEnd) {
                                obj.dragEnd(e, resetMe);
                            }
                            return false;
                        }
                    }
                },
                /**
                 * Translates a pointer event to a me.event
                 * @name init
                 * @memberOf me.DraggableEntity
                 * @function
                 * @param {Object} e: the pointer event you want to translate
                 * @param {String} translation: the me.event you want to translate
                 * the event to
                 */
                translatePointerEvent = function (e, translation) {
                    Glue.event.fire(translation, [e, obj, resetMe]);
                },
                /**
                 * Initializes the events the modules needs to listen to
                 * It translates the pointer events to me.events
                 * in order to make them pass through the system and to make
                 * this module testable. Then we subscribe this module to the
                 * transformed events. This can be inproved by handling it
                 * by the Glue.input module.
                 * @name init
                 * @memberOf me.DraggableEntity
                 * @function
                 */
                 initEvents = function () {
                    pointerDown = function (e) {
                        translatePointerEvent(e, Glue.input.DRAG_START);
                    };
                    pointerUp = function (e) {
                        translatePointerEvent(e, Glue.input.DRAG_END);
                    };
                    Glue.input.pointer.on(Glue.input.POINTER_DOWN, pointerDown, obj);
                    Glue.input.pointer.on(Glue.input.POINTER_UP, pointerUp, obj);
                    Glue.event.on(Glue.input.POINTER_MOVE, dragMove);
                    Glue.event.on(Glue.input.DRAG_START, dragStart);
                    Glue.event.on(Glue.input.DRAG_END, dragEnd);
                };

            // - external interface -
            obj.mix({
                /**
                 * constant for the reset callback type
                 * @desc Will call a callback function which can control the reset of the draggable
                 * @public
                 * @constant
                 * @type String
                 * @name RESET_TYPE_CALLBACK
                 */
                RESET_TYPE_CALLBACK: 'reset-type-callback',
                /**
                 * constant for the reset custom type
                 * @desc Will reset the position of the draggable to a custom configuarable position
                 * @public
                 * @constant
                 * @type String
                 * @name RESET_TYPE_X
                 */
                RESET_TYPE_CUSTOM: 'reset-type-custom',
                /**
                 * constant for the reset x type
                 * @desc Will only reset the x position of the draggable
                 * @public
                 * @constant
                 * @type String
                 * @name RESET_TYPE_X
                 */
                RESET_TYPE_X: 'reset-type-x',
                /**
                 * constant for the reset y type
                 * @desc Will only reset the y position of the draggable
                 * @public
                 * @constant
                 * @type String
                 * @name RESET_TYPE_Y
                 */
                RESET_TYPE_Y: 'reset-type-y',
                /**
                 * Destructor
                 * @name destructDraggable
                 * @memberOf Draggable
                 * @function
                 */
                destructDraggable: function () {
                    // unregister system events
                    Glue.event.off(Glue.input.DRAG_START, dragStart);
                    Glue.event.off(Glue.input.POINTER_MOVE, dragMove);
                    Glue.event.off(Glue.input.DRAG_END, dragEnd);
                    // unregister pointer events
                    Glue.input.pointer.off(Glue.input.POINTER_DOWN, obj);
                    Glue.input.pointer.off(Glue.input.POINTER_UP, obj);
                    // depth sorting fix will solve the need for this
                    highestEntity = null;
                },
                /**
                 * Sets the grab offset of this entity
                 * @name setGrabOffset
                 * @memberOf Draggable
                 * @function
                 * @param {Number} x: the horitontal offset
                 * @param {Number} y: the vertical offset
                 */
                setGrabOffset: function (x, y) {
                    grabOffset = new Glue.math.vector(x, y);
                },
                isResetted: function () {
                    return resetted;
                },
                isDropped: function () {
                    return dropped;
                },
                setDropped: function (value) {
                    if (Glue.sugar.isBoolean(value)) {
                        dropped = value;
                    } else {
                        throw('Please supply a boolean value');
                    }
                },
                setResetted: function (value) {
                    if (Glue.sugar.isBoolean(value)) {
                        resetted = value;
                    } else {
                        throw('Please supply a boolean value');
                    }
                },
                resetMe: function () {
                    return resetMe;
                },
                setCustomResetPosition: function (value) {
                    if (Glue.sugar.isObject(value)) {
                        customResetPosition = value;
                    } else {
                        throw('Please supply an object value');
                    }
                },
                setResetCallback: function (value) {
                    if (Glue.sugar.isFunction(value)) {
                        resetCallback = value;
                    } else {
                        throw('Please supply a function value');
                    }
                },
                setResetType: function (value) {
                    // improvement: check if the value is in the allowed constant array
                    if (Glue.sugar.isString(value)) {
                        resetType = value;
                    } else {
                        throw('Please supply a string value');
                    }
                }
            });

            // - initialisation logic -

            // init drag related events
            initEvents();
            
            // - return external interface -
            return obj;
        };
    }
);
