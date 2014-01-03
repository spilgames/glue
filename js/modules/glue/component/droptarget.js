/*
 *  @module Droptarget
 *  @namespace component
 *  @desc Used to make a game entity behave as a droptarget
 *  @copyright (C) SpilGames
 *  @author Jeroen Reurings
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    'glue/component/droptarget',
    [
        'glue',
        'glue/event/system'
    ],
    function (Glue, Event) {
        return function (obj) {
            var droppedOnMe = function (draggable, e) {
                    // TODO: add more methods (constants) to check on me
                    return obj.visible.getBoundingBox().hasPosition(e.position);
                },
                draggableDropHandler = function (draggable, e) {
                    if (droppedOnMe(obj, e) && obj.onDrop) {
                        obj.onDrop(draggable, e);
                    }
                };

            obj = obj || {};
            obj.droptarget = {
                setup: function (settings) {
                    Event.on('draggable.drop', draggableDropHandler);
                },
                destroy: function () {
                    Event.off('draggable.drop', draggableDropHandler);
                },
                update: function (deltaT) {

                }
            };
            return obj;
        };
    }
);
