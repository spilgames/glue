/*
 *  @module Draggable
 *  @namespace component
 *  @desc Used to make a game entity draggable
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/draggable',
    [
        'glue',
        'glue/math/vector',
        'glue/event/system',
        'glue/basecomponent'
    ],
    function (Glue, Vector, Event, BaseComponent) {
        'use strict';
        var draggables = [],
            dragStartTimeout = 30;

        return function (object) {
            var baseComponent = BaseComponent('draggable', object),
                dragging = false,
                dragId,
                grabOffset = Vector(0, 0),
                isHeighestDraggable = function (object) {
                    var i = 0,
                        l = draggables.length,
                        draggable,
                        result = true;

                    for (i; i < l; ++i) {
                        draggable = draggables[i];
                        if (draggable !== object && draggable.z > object.z) {
                            result = false;
                            break;
                        }
                    }
                    return result;
                },
                checkOnMe = function (e) {
                    return object.getBoundingBox().hasPosition(e.position);
                },
                /**
                 * Gets called when the user starts dragging the entity
                 * @name dragStart
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragStart = function (e) {
                    if (checkOnMe(e) && dragging === false) {
                        draggables.push(object);
                        setTimeout(function () {
                            if (isHeighestDraggable(object)) {
                                dragging = true;
                                dragId = e.pointerId;
                                grabOffset = e.position.substract(object.getPosition());
                                if (object.dragStart) {
                                    object.dragStart(e);
                                }
                                return false;
                            }
                        }, dragStartTimeout);
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
                            object.setPosition(e.position.substract(grabOffset));
                            if (object.dragMove) {
                                object.dragMove(e);
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
                        Event.fire('draggable.drop', object, e);
                        draggables = [];
                        dragId = undefined;
                        dragging = false;
                        if (object.dragEnd) {
                            object.dragEnd(e, function () {});
                        }
                        return false;
                    }
                };

            baseComponent.set({
                pointerDown: function (e) {
                    dragStart(e);
                },
                pointerMove: function (e) {
                    dragMove(e);
                },
                pointerUp: function (e) {
                    dragEnd(e);
                },
                dragStartTimeout: function (value) {
                    dragStartTimeout = value;
                },
                register: function () {
                    baseComponent.register('pointerDown');
                    baseComponent.register('pointerMove');
                    baseComponent.register('pointerUp');
                },
                unregister: function () {
                    baseComponent.unregister('pointerDown');
                    baseComponent.unregister('pointerMove');
                    baseComponent.unregister('pointerUp');
                }
            });

            return object;
        };
    }
);
