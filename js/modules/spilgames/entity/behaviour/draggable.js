/*
 * @module Draggable
 * @namespace modules.spilgames.entity.behaviour
 * @desc Used to make a game entity draggable
 */
glue.module.create(
    'modules/spilgames/entity/behaviour/draggable',
    [
        'glue'
    ],
    function (Glue) {
        /**
         * Constructor
         * @name init
         * @memberOf Draggable
         * @function
         * @param {Object} obj: the entity object
         */
        return function (obj) {
            // - per instance private members -
            var dragging = false,
                dragId = null,
                grabOffset = new Glue.math.vector(0, 0),
                mouseDown = null,
                mouseUp = null,
                pointerId = null,
                /**
                 * Gets called when the user starts dragging the entity
                 * @name dragStart
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragStart = function (e) {
                    if (dragging === false) {
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
                    if (dragging === true) {
                        pointerId = undefined;
                        dragging = false;
                        if (obj.dragEnd) {
                            obj.dragEnd(e);
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
                    Glue.event.fire(translation, [e, obj]);
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
                /**
                 * Updates the entity per cycle, can be overwritten
                 * @name update
                 * @memberOf Draggable
                 * @function
                 */
                update: function () {
                    return true;
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
