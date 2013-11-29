/*
 *  @module Draggable
 *  @namespace modules.spilgames.entity.behaviour
 *  @desc Used to make a game entity draggable
 *  @copyright (C) 2013 SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/draggable',
    [
        'glue'
    ],
    function (Glue) {
        return function (obj) {
            var dragging = false,
                dragId,
                // TODO: Change to Glue Vector
                grabOffset = {
                    x: 0,
                    y: 0
                },
                checkOnMe = function (e) {
                    var position = e.position,
                        boundingBox = obj.visible.getBoundingBox();

                    // TODO: abstract this to overlaps utility method
                    if (position.x >= boundingBox.left && position.x <= boundingBox.right &&
                        position.y >= boundingBox.top && position.y <= boundingBox.bottom) {
                        return true;
                    }
                },
                /**
                 * Gets called when the user starts dragging the entity
                 * @name dragStart
                 * @memberOf Draggable
                 * @function
                 * @param {Object} e: the pointer event
                 */
                dragStart = function (e) {
                    var objectPosition;
                    if (checkOnMe(e) && dragging === false) {
                        objectPosition = obj.visible.getPosition();
                        dragging = true;
                        dragId = e.pointerId;
                        grabOffset = {
                            x: e.position.x - objectPosition.x,
                            y: e.position.y - objectPosition.y
                        };
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
                            // TODO: Change to Glue vector math
                            obj.visible.setPosition({
                                x: e.position.x - grabOffset.x,
                                y: e.position.y - grabOffset.y
                            });
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
                        dragId = undefined;
                        dragging = false;
                        if (obj.dragEnd) {
                            obj.dragEnd(e, resetMe);
                        }
                        return false;
                    }
                };

            obj = obj || {};
            obj.draggable = {
                setup: function (settings) {

                },
                update: function (deltaT) {

                },
                pointerDown: function (e) {
                    dragStart(e);
                },
                pointerMove: function (e) {
                    dragMove(e);
                },
                pointerUp: function (e) {
                    dragEnd(e);
                }
            };
            return obj;
        };
    }
);
