/*
 *  @module Draggable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity draggable
 *  @author Jeroen Reurings
 *  @copyright © 2013 - SpilGames
 */
glue.module.create(
    'glue/modules/spilgames/entity/behaviour/draggable',
    [
        'glue'
    ],
    function (Glue) {
        // - cross instance private members -
        /*
            Depth sorting implementation improvement:
            - Assign z index of Infinity on dragged entity (so it also
              covers HUD and other not draggable entities)
            - Revert back to highgest z index of all draggables
              on drag end (so it is dropped on top of the draggable stack)
        */
        // Most simple implementation that works
        var highestEntity = null,
            maxZ = 2;
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
                    obj.pos.x = position.x;
                    obj.pos.y = position.y;
                },
                /**
                 * Gets called when the user starts dragging the entity
                 * @name dragStart
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragStart = function (e) {
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
                dragEnd = function (e) {
                    highestEntity = null;
                    if (dragging === true) {
                        pointerId = undefined;
                        dragging = false;
                        if (obj.dragEnd) {
                            obj.dragEnd(e, resetMe);
                        }
                        return false;
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
                    Glue.event.on(Glue.input.DRAG_START, function (e, draggable) {
                        if (draggable === obj) {
                            dragStart(e);
                        }
                    });
                    Glue.event.on(Glue.input.DRAG_END, function (e, draggable) {
                        if (draggable === obj) {
                            dragEnd(e);
                        }
                    });
                };

            // - external interface -
            obj.mix({
                /**
                 * Destructor
                 * @name destroy
                 * @memberOf Draggable
                 * @function
                 */
                destroy: function () {
                    Glue.input.pointer.off(Glue.input.POINTER_DOWN);
                    Glue.input.pointer.off(Glue.input.POINTER_UP);
                    Glue.event.off(Glue.input.MOUSE_MOVE, dragMove);
                    Glue.event.off(Glue.input.DRAG_START, dragStart);
                    Glue.event.off(Glue.input.DRAG_END, dragEnd);
                },
                /**
                 * Sets a callback function which will be called when this entity is dragged
                 * @name setDragCallback
                 * @memberOf Draggable
                 * @function
                 * @param {Function} callback: the callback function
                 */
                setDragCallback: function (callback) {
                    dragCallback = callback;
                },
                /**
                 * Sets a callback function which will be called when this entity is dropped
                 * @name setDropCallback
                 * @memberOf Draggable
                 * @function
                 * @param {Function} callback: the callback function
                 */
                setDropCallback: function (callback) {
                    dropCallback = callback;
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
                    }
                },
                setResetted: function (value) {
                    if (Glue.sugar.isBoolean(value)) {
                        resetted = value;
                    }
                },
                resetMe: function () {
                    return resetMe;
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
